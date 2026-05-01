# REST vs GraphQL Performance: First Pass

This document captures a load-test comparison between Strapi v5's REST and GraphQL APIs, run against the `examples/complex` app in the `strapi/strapi` monorepo.

## Setup

- **Strapi version:** v5.44.0 (HEAD of `strapi-core-dev` clone, built from source).
- **Database:** Postgres 16 in Docker (the complex example's `docker-compose.dev.yml`), port 5433.
- **Plugins enabled:** `@strapi/plugin-graphql`, `@strapi/plugin-users-permissions`. No custom plugin config (Shadow CRUD defaults).
- **Seed:** `yarn seed:v5 --multiplier 50` against the complex example.
  - basic: 250
  - basic-dp: 250
  - basic-dp-i18n: 500
  - relation: 250
  - relation-dp: 400
  - relation-dp-i18n: 800
  - upload files: 500
- **Permissions:** Public role granted `find` and `findOne` on `api::basic` and `api::relation`. Snapshot taken after grant so every test run restores the same state.
- **Node:** v22.18.0.
- **Hardware:** macOS, single workstation. Both Strapi and Postgres on the same host.
- **Load runner:** Artillery via `npx artillery@latest`.
- **Load profile per scenario:** 10s warmup at 10 req/s, then 60s at 50 req/s constant arrival rate. ~3,100 requests per scenario.

## Methodology

Per the user's requirement, REST and GraphQL never run together; each scenario goes through a full restart cycle:

1. Stop Strapi (`kill` the dev server on port 1337).
2. Stop the Postgres container (`yarn db:stop:postgres`). Clears `shared_buffers`.
3. Start the Postgres container (`yarn db:start:postgres`).
4. Restore the seeded snapshot (`yarn db:restore:postgres seed-m50-permissioned`). Identical data for every run.
5. Boot Strapi (`yarn develop`). Wait for `/admin/init` to return 200.
6. 5s settle pause so Vite finishes optimizing.
7. Run Artillery against the scenario YAML.
8. Capture the JSON output.
9. Stop Strapi.

Each scenario was run once. This is a first-pass validation of methodology, not the final comparison; for the published numbers we should re-run each scenario three times and report the median.

## Scenarios

Each pair (REST + GraphQL) asks for the same logical data. The shape of the response differs (REST adds `id`, `documentId`, timestamps, and a `meta.pagination` envelope), but the rows fetched and the relations/components materialized are equivalent.

- **A. Simple list, no relations.** List 25 entries from `basic` (scalars only).
- **B. Populated list.** List 25 entries from `relation` with `oneToOneBasic` (one-to-one), `manyToManyBasics` (many-to-many), and `simpleInfo` (single component).
- **C. Deep populate, dynamic zones.** List 10 entries from `relation` with all relations populated, two single components, two repeatable components, and two dynamic zones (`content`, `sections`) with their possible component types.

The full Artillery YAML for each scenario is in `perf/scenarios/`.

## Results

| Scenario | API | Achieved rate (req/s) | Median (ms) | p95 (ms) | p99 (ms) | Max (ms) | 200s | 5xx |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | REST | 50 | 7.9 | 12.1 | 15.0 | 28 | 3100 | 0 |
| A | GraphQL | 50 | 6.0 | 8.9 | 10.9 | 31 | 3100 | 0 |
| B | REST | 50 | 13.1 | 16.9 | 19.9 | 35 | 3100 | 0 |
| B | GraphQL | 50 | 32.8 | 58.6 | 68.7 | 97 | 3100 | 0 |
| C | REST | 49 | 22.0 | 26.8 | 32.1 | 45 | 3100 | 0 |
| C | GraphQL | 40 | 58.6 | 273.2 | 295.9 | 312 | 3100 | 0 |

## Reading the numbers

**Scenario A (simple list).** GraphQL is slightly faster (6.0 vs 7.9 ms median), within noise but consistent across percentiles. REST has a small overhead from the `qs` bracket parser and the `meta.pagination` envelope it serializes. Neither API is meaningfully slow here; both serve a list of 25 plain rows in single-digit milliseconds.

**Scenario B (populated list).** REST is about 2.5× faster on median (13.1 vs 32.8 ms) and 3.5× faster on p95 (16.9 vs 58.6 ms). The shape of the work is the same on the wire (same rows, same relations), but Strapi's GraphQL plugin resolves each relation through its own resolver, which adds per-field overhead.

**Scenario C (deep populate with dynamic zones).** REST stays disciplined: 22 ms median, 26.8 ms p95, 45 ms max, and the server kept up with the configured 50 req/s. GraphQL diverges sharply: 58.6 ms median (~2.7× REST), 273.2 ms p95 (~10× REST), and the achieved request rate dropped to 40 req/s under sustained load (the resolver tree could not keep pace with the targeted arrival rate). The huge p95 gap is the resolver-fan-out shape of the work showing up at the tail.

**Caveat.** This is single-run, no caching, on the same machine, with no client-side library. It does not measure CDN cache hits (REST's strongest case), persisted queries (GraphQL's mitigation), or HTTP/2 multiplexing (REST's other strong card on cold paths). It also does not measure throughput on a dedicated production-class machine with Postgres tuned for the workload. Treat the numbers as a directional comparison, not a benchmark of either API's ceiling.

## Files

- `perf/scenarios/A-rest-list.yml`, `perf/scenarios/A-graphql-list.yml`, etc. — the Artillery YAML for each scenario.
- `perf/run-test.sh` — the orchestrator that does the full restart cycle and runs Artillery.
- `perf/results/<scenario>-<timestamp>.json` — raw Artillery JSON output per run.
- `perf/results/<scenario>-<timestamp>.txt` — Artillery's text summary per run.
- `perf/results/<scenario>-<timestamp>.strapi.log` — Strapi's stdout/stderr during the run.

## Reproduction

```bash
# One-time setup
cd /Users/paul/work/strapi-core-dev
yarn install
yarn build
# Add @strapi/plugin-graphql and pg to examples/complex/package.json, re-yarn install.

cd examples/complex
POSTGRES_PORT=5433 yarn db:start:postgres
DATABASE_CLIENT=postgres DATABASE_PORT=5433 DATABASE_HOST=localhost DATABASE_NAME=strapi DATABASE_USERNAME=strapi DATABASE_PASSWORD=strapi yarn seed:v5 --multiplier 50
POSTGRES_PORT=5433 yarn db:snapshot:postgres seed-m50-permissioned

# Run all six scenarios
cd /Users/paul/work/blog/graphql-customization/api-vs-graph/perf
for s in scenarios/*.yml; do ./run-test.sh "$s"; done
```
