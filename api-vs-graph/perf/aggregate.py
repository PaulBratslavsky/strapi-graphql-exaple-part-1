#!/usr/bin/env python3
"""
aggregate.py — read Artillery JSON results from a suite run and emit a
single markdown summary table.

Usage:
  aggregate.py --label LABEL --runs N --mode MODE \
               --results-dir <dir> --output <path>

Reads every <scenario>-<LABEL>-runK.json file in --results-dir, groups by
scenario, computes the median, min, and max across runs for the
http.response_time percentiles plus the achieved request rate and 200/5xx
counts. Writes a markdown report.
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime


def load_run(json_path: Path) -> dict:
    with json_path.open() as f:
        d = json.load(f)
    agg = d.get("aggregate", {})
    counters = agg.get("counters", {})
    summaries = agg.get("summaries", {})
    rates = agg.get("rates", {})
    rt = summaries.get("http.response_time", {}) or {}

    return {
        "median_ms": rt.get("median"),
        "p95_ms": rt.get("p95"),
        "p99_ms": rt.get("p99"),
        "max_ms": rt.get("max"),
        "min_ms": rt.get("min"),
        "rate_rps": rates.get("http.request_rate"),
        "requests": counters.get("http.requests", 0),
        "codes_2xx": sum(v for k, v in counters.items() if k.startswith("http.codes.2")),
        "codes_4xx": sum(v for k, v in counters.items() if k.startswith("http.codes.4")),
        "codes_5xx": sum(v for k, v in counters.items() if k.startswith("http.codes.5")),
    }


def median(xs):
    xs = [x for x in xs if x is not None]
    if not xs:
        return None
    return statistics.median(xs)


def fmt(v, suffix=""):
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:.1f}{suffix}"
    return f"{v}{suffix}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--label", required=True)
    ap.add_argument("--runs", type=int, required=True)
    ap.add_argument("--mode", required=True)
    ap.add_argument("--results-dir", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    results_dir = Path(args.results_dir)
    pattern = f"*-{args.label}-run*.json"
    files = sorted(results_dir.glob(pattern))
    if not files:
        print(f"no result files match {pattern} in {results_dir}", file=sys.stderr)
        return 2

    # Group runs by scenario name
    by_scenario: dict[str, list[dict]] = defaultdict(list)
    for f in files:
        # filename: <scenario>-<label>-runN.json
        stem = f.stem
        # strip "-runN" suffix
        idx = stem.rfind("-run")
        if idx == -1:
            print(f"skipping unparseable filename: {f.name}", file=sys.stderr)
            continue
        # strip "<scenario>-<label>"
        scenario_label = stem[:idx]
        # strip the label suffix (label has known shape: --label arg)
        if scenario_label.endswith("-" + args.label):
            scenario = scenario_label[: -len(args.label) - 1]
        else:
            scenario = scenario_label
        run = load_run(f)
        run["_file"] = f.name
        by_scenario[scenario].append(run)

    # Compute medians across runs per scenario
    rows = []
    for scenario in sorted(by_scenario.keys()):
        runs = by_scenario[scenario]
        rows.append({
            "scenario": scenario,
            "n_runs": len(runs),
            "median_p50": median([r["median_ms"] for r in runs]),
            "median_p95": median([r["p95_ms"] for r in runs]),
            "median_p99": median([r["p99_ms"] for r in runs]),
            "min_p50": min((r["median_ms"] for r in runs if r["median_ms"] is not None), default=None),
            "max_p50": max((r["median_ms"] for r in runs if r["median_ms"] is not None), default=None),
            "min_p95": min((r["p95_ms"] for r in runs if r["p95_ms"] is not None), default=None),
            "max_p95": max((r["p95_ms"] for r in runs if r["p95_ms"] is not None), default=None),
            "median_rate": median([r["rate_rps"] for r in runs]),
            "min_rate": min((r["rate_rps"] for r in runs if r["rate_rps"] is not None), default=None),
            "total_2xx": sum(r["codes_2xx"] for r in runs),
            "total_4xx": sum(r["codes_4xx"] for r in runs),
            "total_5xx": sum(r["codes_5xx"] for r in runs),
        })

    # Write the markdown
    out = Path(args.output)
    lines: list[str] = []
    lines.append(f"# Perf suite summary — `{args.label}`")
    lines.append("")
    lines.append(f"- **Generated:** {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"- **Mode:** `{args.mode}` ({'production build, `yarn start`' if args.mode == 'start' else 'dev mode, `yarn develop`'})")
    lines.append(f"- **Runs per scenario:** {args.runs}")
    lines.append(f"- **Scenarios found:** {len(rows)}")
    lines.append(f"- **Result files:** {len(files)} JSON files matching `{pattern}` in `{results_dir.name}/`")
    lines.append("")
    lines.append("Each row reports the median across the N runs for each metric, plus the")
    lines.append("min and max p50 / p95 to show run-to-run variance. `rate` is the achieved")
    lines.append("request rate per second (lower than the configured 50 means the server")
    lines.append("could not keep up).")
    lines.append("")
    lines.append("| Scenario | N | p50 ms (median / min / max) | p95 ms (median / min / max) | p99 ms median | rate r/s (median / min) | 2xx | 4xx | 5xx |")
    lines.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for r in rows:
        p50_cell = f"{fmt(r['median_p50'])} / {fmt(r['min_p50'])} / {fmt(r['max_p50'])}"
        p95_cell = f"{fmt(r['median_p95'])} / {fmt(r['min_p95'])} / {fmt(r['max_p95'])}"
        rate_cell = f"{fmt(r['median_rate'])} / {fmt(r['min_rate'])}"
        lines.append(
            f"| `{r['scenario']}` | {r['n_runs']} | {p50_cell} | {p95_cell} | {fmt(r['median_p99'])} | {rate_cell} | {r['total_2xx']} | {r['total_4xx']} | {r['total_5xx']} |"
        )
    lines.append("")

    # Per-scenario raw run details
    lines.append("## Per-scenario raw runs")
    for scenario in sorted(by_scenario.keys()):
        lines.append("")
        lines.append(f"### `{scenario}`")
        lines.append("")
        lines.append("| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
        for i, r in enumerate(by_scenario[scenario], start=1):
            lines.append(
                f"| {i} | {fmt(r['median_ms'])} | {fmt(r['p95_ms'])} | {fmt(r['p99_ms'])} | {fmt(r['max_ms'])} | {fmt(r['rate_rps'])} | {r['codes_2xx']} | {r['codes_4xx']} | {r['codes_5xx']} | `{r['_file']}` |"
            )

    out.write_text("\n".join(lines) + "\n")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
