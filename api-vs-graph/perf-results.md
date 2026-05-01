# REST vs GraphQL Performance: Production-Mode Results

This is the headline summary. Full methodology, every restart-cycle detail, and what we deliberately did not test are in [`perf/METHODOLOGY.md`](./perf/METHODOLOGY.md). Raw per-run JSON and the suite log are in [`perf/results/`](./perf/results/).

## Setup

- **Strapi:** v5.44.0, production build (`yarn build` then `yarn start`), `NODE_ENV=production`, telemetry off.
- **App:** `examples/complex` from the `strapi/strapi` monorepo.
- **DB:** Postgres 16 in Docker, defaults.
- **Plugins:** `@strapi/plugin-graphql`, `@strapi/plugin-users-permissions`. Shadow CRUD defaults.
- **Seed:** `yarn seed:v5 --multiplier 50` — ~2,950 entries plus 500 media files.
- **Permissions:** Public role with `find`, `findOne` on `api::basic` and `api::relation`, plus `create` on `api::basic`. Snapshot taken after the grant; every run restores from the snapshot.
- **Load:** Artillery, 10s warmup at 10 req/s + 60s sustained at 50 req/s constant arrival rate, ~3,100 requests per run.
- **Restart between runs:** Strapi process killed, Postgres container stopped, Postgres container started, snapshot restored, Strapi rebooted, 3s settle. REST and GraphQL never run together.
- **Runs per scenario:** 5. Median of five reported.
- **Hardware:** Single MacBook (load runner, Strapi, and Postgres all on one machine).

## Results: median across 5 runs

| Scenario | API | p50 (ms) | p95 (ms) | p99 (ms) | rate (req/s) | 2xx |
| --- | --- | --- | --- | --- | --- | --- |
| A. Simple list, no relations | REST | 7 | 10.1 | 12.1 | 50 | 15,500 |
| A. Simple list, no relations | GraphQL | 5 | 7 | 8.9 | 50 | 15,500 |
| B. Populated list (relations + component, 25) | REST | 12.1 | 13.9 | 16.9 | 50 | 15,500 |
| B. Populated list (relations + component, 25) | GraphQL | 27.9 | 47.9 | 58.6 | 50 | 13,534 |
| C. Deep populate with dynamic zones (10) | REST | 15 | 22 | 24.8 | 50 | 15,500 |
| C. Deep populate with dynamic zones (10) | GraphQL | 37.7 | 66 | 76 | 50 | 15,500 |
| D. Create one entry | REST | 5 | 7.9 | 10.9 | 47 | 15,500 |
| D. Create one entry | GraphQL | 5 | 8.9 | 10.1 | 50 | 15,500 |

## Findings

### 1. Simple list (A): GraphQL is faster, both are very fast

GraphQL: 5 ms median, 7 ms p95. REST: 7 ms median, 10.1 ms p95. The GraphQL response carries only the selected fields; the REST response always includes `id`, `documentId`, `createdAt`, `updatedAt`, `publishedAt`, plus a `meta.pagination` envelope. That extra serialization plus `qs` query-string parsing accounts for most of the gap. Both are well below any threshold a user would notice.

### 2. Populated list (B): REST is roughly 2.3× faster on median, 3.4× faster on p95

REST: 12.1 ms median, 13.9 ms p95. GraphQL: 27.9 ms median, 47.9 ms p95. Same logical request: 25 entries with one one-to-one relation, one many-to-many, and one component populated. Same SQL rows underneath. The cost lives in Strapi's GraphQL plugin: each relation has its own resolver, and the per-field overhead compounds.

### 3. Deep populate with dynamic zones (C): REST is 2.5× faster on median, 3× faster on p95

REST: 15 ms median, 22 ms p95, 24.8 ms p99. GraphQL: 37.7 ms median, 66 ms p95, 76 ms p99. The deeper the selection, the wider the gap. REST also has a tighter tail.

### 4. Simple create (D): the two APIs are at parity

REST: 5 ms median, 7.9 ms p95. GraphQL: 5 ms median, 8.9 ms p95. The resolver-overhead penalty that hurts GraphQL on populated reads does not show up on a write that returns a single entity. Both APIs go through the same Document Service, the same validation, the same insert. The work is dominated by the database round trip and the response is small (one row, three fields), so neither API can pull ahead on the read-path resolver tree because there isn't one.

### 5. Throughput ceiling

On A, B (median run), C, and D, both APIs sustained 50 req/s without errors. The exception is a single B-GraphQL run that backed up under load (see "Run-to-run variance" below). On C-GraphQL, the median achieved rate was 50 req/s but one run dropped to 22 req/s, suggesting the saturation point for that scenario is right around the 50 req/s arrival rate.

## Run-to-run variance

Most cells were tight across the 5 runs. The outliers worth knowing about:

- **B-GraphQL run 2** had p95 = 3,752 ms with only 1,134 of 3,000 requests completing. The other four runs of the same scenario were 46–49 ms p95 with all 3,000 completing. The median (which is what the table reports) is unaffected. The outlier is consistent with GraphQL's tail-latency behavior under saturation: when the resolver tree fans out and the queue backs up, the tail goes vertical.
- **C-GraphQL** showed achieved-rate variance: 4 runs at 50 req/s, 1 run at 22 req/s. Median p50 across runs was tight (34.1 to 40 ms). The throughput drop is the saturation cliff again.
- **REST scenarios** had little variance. The min/max ranges across 5 runs were within 3 ms on every percentile for every REST scenario. Even when one D-REST run reported only 44 req/s achieved, the latency profile was identical to the other runs.

The pattern: GraphQL has a closer saturation cliff under load. Below the cliff its latency is consistent; above it the tail explodes. REST stays predictable through the whole tested range.

## What this measures (and does not)

What it measures: server-side latency of the two APIs against the same Postgres database, with cold caches at the start of each run, no CDN, no APQ, no client-side library, on a single workstation.

What it does not measure: REST plus a CDN serving from the edge, GraphQL plus persisted queries, multi-machine production setups, tuned Postgres, network latency between client and server, and several other things spelled out in [`METHODOLOGY.md`](./perf/METHODOLOGY.md). The numbers above are a directional comparison, not a benchmark of either API's ceiling.

## Reproducing

```bash
# One-time setup (see METHODOLOGY.md for full instructions)
cd /Users/paul/work/strapi-core-dev
yarn install && yarn build
# Add @strapi/plugin-graphql and pg to examples/complex/package.json, yarn install again.

cd examples/complex
POSTGRES_PORT=5433 yarn db:start:postgres
DATABASE_CLIENT=postgres DATABASE_PORT=5433 \
DATABASE_HOST=localhost DATABASE_NAME=strapi \
DATABASE_USERNAME=strapi DATABASE_PASSWORD=strapi \
yarn seed:v5 --multiplier 50
# Boot Strapi once, register an admin, grant Public find/findOne on
# api::basic + api::relation and create on api::basic, then snapshot:
POSTGRES_PORT=5433 yarn db:snapshot:postgres seed-m50-permissioned
yarn build  # production bundle for `yarn start`

# Run the suite
cd /Users/paul/work/blog/graphql-customization/api-vs-graph/perf
./run-suite.sh --runs 5 --mode start --label suite-prod-m50
# Output: results/<scenario>-suite-prod-m50-runN.json/.txt/.strapi.log
#         results/suite-suite-prod-m50.log
#         results/summary-suite-prod-m50.md
```
