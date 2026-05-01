# REST vs GraphQL Performance Test: Methodology

This document spells out exactly how the REST vs GraphQL performance test in this directory works, what it does and does not measure, and how to reproduce or extend it. The goal is for a hostile reviewer to be able to follow the test from clone-to-numbers and either accept or replace each decision.

## What the test compares

Strapi v5's REST API and Strapi v5's GraphQL API (`@strapi/plugin-graphql`), serving the same logical request shapes against the same Postgres database, on the same Strapi process, on the same machine.

It does not compare REST vs GraphQL "in general." The numbers reflect Strapi's specific implementation: the Koa REST controller stack, the Apollo Server v4 plus Strapi resolvers GraphQL stack, and the `@strapi/database` query layer that both share underneath.

## What the test does NOT measure

- **CDN-cached REST responses.** A `Cache-Control: public, s-maxage=60` GET served from an edge cache is single-digit milliseconds and skips the origin. We do not put a CDN in front of Strapi. Adding one would shift REST's already-favorable numbers further in REST's favor, especially on warm paths.
- **Persisted queries (APQ) for GraphQL.** Apollo Server supports automatic persisted queries, which let GET-style GraphQL responses be cached by a CDN. We do not enable APQ. Doing so would close part of GraphQL's gap on read-heavy workloads.
- **Cross-machine network latency.** The load runner, Strapi, and Postgres all run on the same workstation. Real production traffic crosses the network; that adds latency to both APIs equally and does not change the comparison meaningfully.
- **Cold-start performance.** Every test starts after Strapi is fully booted and after a 3-second settle pause. We do not measure first-request latency.
- **Authenticated request paths.** Requests are made as the Public role with `find`, `findOne`, and `create` permissions granted on the test content types. We do not exercise JWT validation or U&P middleware overhead beyond the Public-role check.
- **Production-class hardware.** A single MacBook is not a server. Numbers on a tuned Postgres on a real EC2 box would be different (mostly: lower latency, higher ceiling on both APIs). The comparison between the two APIs should still hold in shape.

## Stack under test

- **Strapi:** v5.44.0, built from the `strapi/strapi` monorepo at `/Users/paul/work/strapi-core-dev`.
- **Plugins:** `@strapi/plugin-graphql`, `@strapi/plugin-users-permissions`. No custom plugin config, defaults only (Shadow CRUD on for both APIs).
- **Database:** Postgres 16 (`postgres:16` Docker image), default `shared_buffers`, no tuning. Port 5433 (5432 was already in use by another project on this workstation).
- **Application:** `examples/complex` from the monorepo. Eight content types (`basic`, `basic-dp`, `basic-dp-i18n`, `relation`, `relation-dp`, `relation-dp-i18n`, plus two high-cardinality m2m schemas not exercised in these tests).
- **Strapi mode:** Production build (`yarn build` then `yarn start`). Not `yarn develop`. Telemetry off (`STRAPI_TELEMETRY_DISABLED=true`).
- **Node:** v22.18.0.
- **Load runner:** Artillery v2.x via `npx artillery@latest run`. Single-machine, same workstation as Strapi and Postgres.

## Seed

`yarn seed:v5 --multiplier 50` against the complex example produces:

- 250 `basic` entries
- 250 `basic-dp` entries (150 published + 100 draft)
- 500 `basic-dp-i18n` entries (250 per locale × 2 locales)
- 250 `relation` entries
- 400 `relation-dp` entries (250 published + 150 draft)
- 800 `relation-dp-i18n` entries (250 per locale × 2 locales × published+draft)
- 500 upload-file rows

The multiplier (50) is on the small side intentionally: large enough that Postgres is doing real index lookups instead of returning pages from L1 cache, small enough that the seed completes in a few minutes per restart. Multiplier 100 takes ~8–10 minutes per seed; 50 takes ~3 minutes.

After seeding, Strapi is booted once, an admin user is registered (`admin@test.local`), and the Public role is granted `find`, `findOne`, and `create` permissions on `api::basic` and `api::relation`. The DB is then dumped to `snapshots/postgres-seed-m50-permissioned.sql` and that snapshot is the canonical starting state for every test run.

## Restart-between-runs protocol

Each scenario goes through this cycle:

1. **Stop Strapi.** Find the PID owning port 1337 and `kill` it. Wait 3 seconds.
2. **Stop the Postgres container.** `yarn db:stop:postgres`. This drops Postgres's `shared_buffers` cache.
3. **Start the Postgres container.** `yarn db:start:postgres`.
4. **Restore the seeded snapshot.** `yarn db:restore:postgres seed-m50-permissioned`. Identical DB state for every run.
5. **Boot Strapi.** `yarn start`, with the Postgres connection env vars set, telemetry off, `NODE_ENV=production`. Wait for `/admin/init` to return 200 (typically ~3s in production mode).
6. **Settle.** Sleep 3 seconds for V8 JIT warmup. (In dev mode we sleep longer because Vite optimizes dependencies on early requests; in production mode that does not happen.)
7. **Run Artillery.** Single scenario YAML. Capture the JSON output.
8. **Stop Strapi.**

The point of steps 2–4 is that REST and GraphQL never share a Strapi process or a Postgres process. Each test starts cold. There is no possibility of one API benefiting from a cache the other warmed.

## Load profile

Per scenario:

- **Warmup phase:** 10 seconds, 10 requests per second arrival rate, constant. ~100 warmup requests.
- **Load phase:** 60 seconds, 50 requests per second arrival rate, constant. ~3,000 load requests.

Total ~3,100 requests per run. Artillery's "constant arrival rate" model means new virtual users start at the configured rate regardless of whether old ones have finished; this is closed-loop behavior, the kind that shows up under real traffic, not the open-loop "as fast as possible" benchmark style.

If the server cannot keep up (resolver tree stalled, DB lock contention, etc.), Artillery's reported `http.request_rate` falls below 50/s. That is itself a finding: the server's effective ceiling for that scenario is lower than 50 req/s.

## Scenarios

Each pair (REST + GraphQL) asks for the same logical data; the wire payloads differ by REST's auto-included `id`/`documentId`/timestamps and `meta.pagination` envelope, which adds bytes but not much CPU.

### Reads

- **A. Simple list, no relations.** List 25 `basic` entries (scalars only).
  - REST: `GET /api/basics?pagination[pageSize]=25`
  - GraphQL: `{ basics(pagination: { pageSize: 25 }) { documentId stringField } }`
- **B. Populated list.** List 25 `relation` entries with one one-to-one relation, one many-to-many, and one component populated.
  - REST: `GET /api/relations?pagination[pageSize]=25&populate[oneToOneBasic]=true&populate[manyToManyBasics]=true&populate[simpleInfo]=true`
  - GraphQL: `{ relations(pagination: { pageSize: 25 }) { documentId name oneToOneBasic { stringField } manyToManyBasics { stringField } simpleInfo { title } } }`
- **C. Deep populate, dynamic zones.** List 10 `relation` entries with all relations, two single components, two repeatable components, and two dynamic zones with their possible component types.
  - REST: `GET /api/relations?pagination[pageSize]=10&populate[oneToOneBasic]=true&populate[manyToManyBasics]=true&populate[simpleInfo]=true&populate[textBlocks]=true&populate[mediaBlock]=true&populate[content][on][shared.simple-info][populate]=*&populate[content][on][shared.image-block][populate]=*&populate[sections][on][shared.text-block][populate]=*&populate[sections][on][shared.media-block][populate]=*`
  - GraphQL: a `relations(pagination: { pageSize: 10 })` query selecting the same relations, components, and DZ items via inline fragments.

### Writes

- **D. Create one entry.** Create a single `basic` entry with three scalar fields.
  - REST: `POST /api/basics` with `{ "data": { "stringField": "perf-test", "integerField": 42, "booleanField": true } }`
  - GraphQL: `mutation { createBasic(data: { stringField: "perf-test-gql", integerField: 42, booleanField: true }) { documentId } }`

The full Artillery YAML for each scenario lives in `perf/scenarios/`.

## Statistical approach

For each scenario, the suite runs N passes (default 5). Per scenario we report:

- **Median across the N runs**, for `p50` (median latency), `p95`, and `p99`.
- **Min and max across the N runs**, for `p50` and `p95`. The spread between min and max is the run-to-run variance.
- **Median achieved request rate**. Below the configured 50 req/s means the server could not keep pace.
- **Total 200, 4xx, 5xx counts** across all N runs.

The aggregator (`perf/aggregate.py`) reads every JSON output that matches the suite's `--label` and computes the table above into `perf/results/summary-<label>.md`.

Five runs is the floor for this kind of comparison. Three is too few to reject a one-off outlier. Ten or more would tighten the median further but is expensive (each run takes ~100s wall clock end-to-end).

## How to reproduce

Prerequisites: Docker Desktop running, the `strapi/strapi` monorepo cloned, `@strapi/plugin-graphql` and `pg` added to `examples/complex/package.json` as workspace deps, `yarn install && yarn build` at the monorepo root.

```bash
# One-time: seed and snapshot
cd /Users/paul/work/strapi-core-dev/examples/complex
POSTGRES_PORT=5433 yarn db:start:postgres
DATABASE_CLIENT=postgres DATABASE_PORT=5433 \
DATABASE_HOST=localhost DATABASE_NAME=strapi \
DATABASE_USERNAME=strapi DATABASE_PASSWORD=strapi \
yarn seed:v5 --multiplier 50

# Boot Strapi once, register admin (admin@test.local / PerfTest123!),
# grant Public find/findOne/create on api::basic and find/findOne on api::relation,
# stop Strapi.

# Snapshot the seeded + permissioned state
POSTGRES_PORT=5433 yarn db:snapshot:postgres seed-m50-permissioned

# Build the complex example for production
yarn build

# Run the suite
cd /Users/paul/work/blog/graphql-customization/api-vs-graph/perf
./run-suite.sh --runs 5 --mode start --label suite-prod-m50
# Output:
#   results/<scenario>-suite-prod-m50-runN.json (one per run)
#   results/<scenario>-suite-prod-m50-runN.txt  (one per run, Artillery text)
#   results/<scenario>-suite-prod-m50-runN.strapi.log
#   results/suite-suite-prod-m50.log            (suite-level log)
#   results/summary-suite-prod-m50.md           (aggregated table)
```

## Files

- `perf/scenarios/A-rest-list.yml`, `A-graphql-list.yml`, `B-rest-populated.yml`, `B-graphql-populated.yml`, `C-rest-deep.yml`, `C-graphql-deep.yml`, `D-rest-create.yml`, `D-graphql-create.yml` — Artillery scenario configs.
- `perf/run-test.sh <scenario.yml>` — single test, full restart cycle. Honors `STRAPI_MODE` (`develop` or `start`), `SUITE_LABEL`, `RUN_INDEX`.
- `perf/run-suite.sh [--runs N] [--mode] [--label] [--scenarios]` — runs the matrix, calls aggregator at the end.
- `perf/aggregate.py` — reads JSON files matching a label, writes the markdown summary.
- `perf/results/` — every Artillery JSON, every Artillery text log, every Strapi stdout log, the suite-level log, and the aggregated summary.

## Known limitations

1. **Single-machine.** Load runner contends with Strapi and Postgres for the same CPU pool. Real test setups use a separate runner host. Difference in absolute latency: probably small. Difference in achievable throughput at saturation: probably meaningful.
2. **Postgres is unconfigured.** `shared_buffers`, `work_mem`, `max_connections` are at the Postgres 16 image defaults. Strapi's connection pool defaults are `min: 0, max: 10`. A real production setup would tune these. We don't.
3. **No backpressure handling.** Artillery's constant arrival rate means requests pile up if the server stalls. A real client would back off. Our test would not detect a server that gracefully degrades vs. one that doesn't.
4. **No cache headers, no APQ.** As stated above, this isolates the raw API surface comparison; real production deployments would lean on caching to close the gap.
5. **One workstation, one timezone, one machine load profile.** Background processes (Spotlight, browser, editor) compete for CPU. Variance from this is real and shows up in the run-to-run spread the aggregator reports.

The numbers are a directional comparison, not a benchmark of either API's ceiling.
