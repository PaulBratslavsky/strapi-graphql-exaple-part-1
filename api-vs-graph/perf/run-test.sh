#!/usr/bin/env bash
# run-test.sh <scenario.yml>
# Full restart cycle: stop Strapi, stop+start Postgres, restore snapshot,
# boot Strapi, run Artillery, capture results.
#
# Optional environment:
#   STRAPI_MODE=develop|start   (default develop)
#                               start = production build, requires `yarn build`
#                                       in the complex example beforehand.
#   SUITE_LABEL=<label>         filename tag, used by run-suite.sh
#   RUN_INDEX=<n>               run number tag, used by run-suite.sh
#   COMPLEX_DIR=<path>          override the strapi complex example path

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <scenario.yml>"
  exit 1
fi

SCENARIO_YAML="$1"
SCENARIO_NAME="$(basename "$SCENARIO_YAML" .yml)"
PERF_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$PERF_DIR/results"
COMPLEX_DIR="${COMPLEX_DIR:-/Users/paul/work/strapi-core-dev/examples/complex}"
SNAPSHOT="seed-m50-permissioned"
STRAPI_MODE="${STRAPI_MODE:-develop}"
SUITE_LABEL="${SUITE_LABEL:-}"
RUN_INDEX="${RUN_INDEX:-}"

mkdir -p "$RESULTS_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# Build the filename suffix. When called from run-suite.sh, SUITE_LABEL and
# RUN_INDEX are set so the aggregator can group runs by label.
if [ -n "$SUITE_LABEL" ] && [ -n "$RUN_INDEX" ]; then
  TAG="${SUITE_LABEL}-run${RUN_INDEX}"
else
  TAG="$TIMESTAMP"
fi

JSON_OUT="$RESULTS_DIR/${SCENARIO_NAME}-${TAG}.json"
TXT_OUT="$RESULTS_DIR/${SCENARIO_NAME}-${TAG}.txt"
STRAPI_LOG="$RESULTS_DIR/${SCENARIO_NAME}-${TAG}.strapi.log"

export DATABASE_CLIENT=postgres
export DATABASE_PORT=5433
export DATABASE_HOST=localhost
export DATABASE_NAME=strapi
export DATABASE_USERNAME=strapi
export DATABASE_PASSWORD=strapi
export POSTGRES_PORT=5433
export STRAPI_TELEMETRY_DISABLED=true
export NODE_ENV="${NODE_ENV:-development}"

# In production mode, force NODE_ENV=production
if [ "$STRAPI_MODE" = "start" ]; then
  export NODE_ENV=production
fi

echo "=== [$SCENARIO_NAME] starting full restart cycle (mode=$STRAPI_MODE) ==="

# 1. Stop Strapi if running
PID=$(lsof -nP -iTCP:1337 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "  stopping Strapi (pid $PID)"
  kill "$PID" || true
  sleep 3
fi

# 2. Stop Postgres container
echo "  stopping Postgres container"
( cd "$COMPLEX_DIR" && yarn db:stop:postgres > /dev/null 2>&1 ) || true

# 3. Start Postgres container
echo "  starting Postgres container"
( cd "$COMPLEX_DIR" && yarn db:start:postgres > /dev/null 2>&1 )

# 4. Restore snapshot
echo "  restoring snapshot $SNAPSHOT"
( cd "$COMPLEX_DIR" && yarn db:restore:postgres "$SNAPSHOT" > /dev/null 2>&1 )

# 5. Boot Strapi
echo "  booting Strapi ($STRAPI_MODE mode, log: $STRAPI_LOG)"
( cd "$COMPLEX_DIR" && yarn "$STRAPI_MODE" > "$STRAPI_LOG" 2>&1 ) &
STRAPI_PID=$!

# 6. Wait for ready
READY=0
for i in $(seq 1 90); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/admin/init 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "  Strapi up after ${i}s"
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" -ne 1 ]; then
  echo "  ERROR: Strapi did not become ready in 180s"
  echo "  ---- last 30 lines of strapi log ----"
  tail -30 "$STRAPI_LOG" || true
  PID=$(lsof -nP -iTCP:1337 -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$PID" ]; then kill "$PID" || true; fi
  exit 1
fi

# Settle pause: in develop mode, Vite optimization runs on early requests.
# In production, no Vite involved, but we still pause for V8 warmup.
if [ "$STRAPI_MODE" = "develop" ]; then
  sleep 8
else
  sleep 3
fi

# 7. Run Artillery
echo "  running Artillery on $SCENARIO_YAML"
npx --yes artillery@latest run \
  --output "$JSON_OUT" \
  "$SCENARIO_YAML" 2>&1 | tee "$TXT_OUT"

# 8. Stop Strapi
echo "  stopping Strapi"
PID=$(lsof -nP -iTCP:1337 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PID" ]; then
  kill "$PID" || true
fi
sleep 2

echo "=== [$SCENARIO_NAME] done ==="
echo "    raw JSON: $JSON_OUT"
echo "    text log: $TXT_OUT"
