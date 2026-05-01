#!/usr/bin/env bash
# run-suite.sh
#
# Orchestrate the full perf matrix: every scenario × N runs, with a full
# Strapi+Postgres restart between each. Then call the aggregator to produce
# a single markdown summary.
#
# Usage:
#   ./run-suite.sh [--runs N] [--mode develop|start] [--label LABEL] [--scenarios "A-* B-*"]
#
# Defaults: runs=5, mode=start (production), label=auto-timestamp, all scenarios.

set -euo pipefail

RUNS=5
MODE=start
LABEL=""
SCENARIOS_LIST=""

while [ $# -gt 0 ]; do
  case "$1" in
    --runs) RUNS="$2"; shift 2;;
    --mode) MODE="$2"; shift 2;;
    --label) LABEL="$2"; shift 2;;
    --scenarios) SCENARIOS_LIST="$2"; shift 2;;
    -h|--help)
      sed -n '2,12p' "$0"; exit 0;;
    *) echo "unknown arg: $1"; exit 1;;
  esac
done

PERF_DIR="$(cd "$(dirname "$0")" && pwd)"
SCENARIOS_DIR="$PERF_DIR/scenarios"
RESULTS_DIR="$PERF_DIR/results"
mkdir -p "$RESULTS_DIR"

if [ -z "$LABEL" ]; then
  LABEL="$(date +%Y%m%d-%H%M%S)"
fi

if [ -z "$SCENARIOS_LIST" ]; then
  # Default: every .yml in scenarios/, in alphabetical order
  SCENARIOS=()
  while IFS= read -r f; do SCENARIOS+=("$f"); done < <(find "$SCENARIOS_DIR" -maxdepth 1 -name '*.yml' | sort)
else
  # Treat SCENARIOS_LIST as a space-separated list of glob patterns
  SCENARIOS=()
  for pat in $SCENARIOS_LIST; do
    while IFS= read -r f; do SCENARIOS+=("$f"); done < <(find "$SCENARIOS_DIR" -maxdepth 1 -name "$pat" | sort)
  done
fi

if [ "${#SCENARIOS[@]}" -eq 0 ]; then
  echo "no scenarios matched"; exit 1
fi

SUITE_LOG="$RESULTS_DIR/suite-$LABEL.log"
echo "==================================================================" | tee "$SUITE_LOG"
echo "Suite: label=$LABEL, mode=$MODE, runs=$RUNS, scenarios=${#SCENARIOS[@]}" | tee -a "$SUITE_LOG"
echo "Started: $(date -Iseconds)" | tee -a "$SUITE_LOG"
echo "==================================================================" | tee -a "$SUITE_LOG"

START_EPOCH=$(date +%s)

# Outer loop: by run index. Inner loop: scenarios. This way each pass
# through the matrix gives one observation per scenario, and noise from
# whatever else the workstation is doing distributes across scenarios.
for run in $(seq 1 "$RUNS"); do
  for s in "${SCENARIOS[@]}"; do
    SCENARIO_NAME="$(basename "$s" .yml)"
    echo "" | tee -a "$SUITE_LOG"
    echo "----- [run $run / $RUNS] $SCENARIO_NAME -----" | tee -a "$SUITE_LOG"
    STRAPI_MODE="$MODE" SUITE_LABEL="$LABEL" RUN_INDEX="$run" \
      "$PERF_DIR/run-test.sh" "$s" 2>&1 | tee -a "$SUITE_LOG"
  done
done

END_EPOCH=$(date +%s)
ELAPSED=$((END_EPOCH - START_EPOCH))

echo "" | tee -a "$SUITE_LOG"
echo "==================================================================" | tee -a "$SUITE_LOG"
echo "Suite complete in ${ELAPSED}s." | tee -a "$SUITE_LOG"

SUMMARY_OUT="$RESULTS_DIR/summary-$LABEL.md"
echo "Aggregating into $SUMMARY_OUT" | tee -a "$SUITE_LOG"
python3 "$PERF_DIR/aggregate.py" \
  --label "$LABEL" \
  --runs "$RUNS" \
  --mode "$MODE" \
  --results-dir "$RESULTS_DIR" \
  --output "$SUMMARY_OUT"

echo "" | tee -a "$SUITE_LOG"
echo "Summary: $SUMMARY_OUT" | tee -a "$SUITE_LOG"
