# Perf suite summary — `suite-prod-m50`

- **Generated:** 2026-05-01T18:32:12
- **Mode:** `start` (production build, `yarn start`)
- **Runs per scenario:** 5
- **Scenarios found:** 8
- **Result files:** 40 JSON files matching `*-suite-prod-m50-run*.json` in `results/`

Each row reports the median across the N runs for each metric, plus the
min and max p50 / p95 to show run-to-run variance. `rate` is the achieved
request rate per second (lower than the configured 50 means the server
could not keep up).

| Scenario | N | p50 ms (median / min / max) | p95 ms (median / min / max) | p99 ms median | rate r/s (median / min) | 2xx | 4xx | 5xx |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `A-graphql-list` | 5 | 5 / 5 / 5 | 7 / 7 / 7 | 8.9 | 50 / 50 | 15500 | 0 | 0 |
| `A-rest-list` | 5 | 7 / 7 / 7 | 10.1 / 10.1 / 10.1 | 12.1 | 50 / 25 | 15500 | 0 | 0 |
| `B-graphql-populated` | 5 | 27.9 / 22.9 / 29.1 | 47.9 / 46.1 / 3752.7 | 58.6 | 50 / 50 | 13534 | 0 | 0 |
| `B-rest-populated` | 5 | 12.1 / 10.1 / 13.1 | 13.9 / 13.9 / 15 | 16.9 | 50 / 40 | 15500 | 0 | 0 |
| `C-graphql-deep` | 5 | 37.7 / 34.1 / 40 | 66 / 63.4 / 68.7 | 76 | 50 / 22 | 15500 | 0 | 0 |
| `C-rest-deep` | 5 | 15 / 15 / 21.1 | 22 / 22 / 24.8 | 24.8 | 50 / 45 | 15500 | 0 | 0 |
| `D-graphql-create` | 5 | 5 / 5 / 6 | 8.9 / 7.9 / 8.9 | 10.1 | 50 / 22 | 15500 | 0 | 0 |
| `D-rest-create` | 5 | 5 / 5 / 6 | 7.9 / 7.9 / 8.9 | 10.9 | 47 / 44 | 15500 | 0 | 0 |

## Per-scenario raw runs

### `A-graphql-list`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 5 | 7 | 8.9 | 30 | 50 | 3100 | 0 | 0 | `A-graphql-list-suite-prod-m50-run1.json` |
| 2 | 5 | 7 | 8.9 | 29 | 50 | 3100 | 0 | 0 | `A-graphql-list-suite-prod-m50-run2.json` |
| 3 | 5 | 7 | 8.9 | 23 | 50 | 3100 | 0 | 0 | `A-graphql-list-suite-prod-m50-run3.json` |
| 4 | 5 | 7 | 8.9 | 26 | 50 | 3100 | 0 | 0 | `A-graphql-list-suite-prod-m50-run4.json` |
| 5 | 5 | 7 | 10.1 | 28 | 50 | 3100 | 0 | 0 | `A-graphql-list-suite-prod-m50-run5.json` |

### `A-rest-list`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | 10.1 | 13.1 | 27 | 50 | 3100 | 0 | 0 | `A-rest-list-suite-prod-m50-run1.json` |
| 2 | 7 | 10.1 | 12.1 | 24 | 50 | 3100 | 0 | 0 | `A-rest-list-suite-prod-m50-run2.json` |
| 3 | 7 | 10.1 | 12.1 | 23 | 50 | 3100 | 0 | 0 | `A-rest-list-suite-prod-m50-run3.json` |
| 4 | 7 | 10.1 | 12.1 | 23 | 25 | 3100 | 0 | 0 | `A-rest-list-suite-prod-m50-run4.json` |
| 5 | 7 | 10.1 | 12.1 | 23 | 46 | 3100 | 0 | 0 | `A-rest-list-suite-prod-m50-run5.json` |

### `B-graphql-populated`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 29.1 | 48.9 | 58.6 | 87 | 50 | 3100 | 0 | 0 | `B-graphql-populated-suite-prod-m50-run1.json` |
| 2 | 29.1 | 3752.7 | 4770.6 | 5087 | 231 | 1134 | 0 | 0 | `B-graphql-populated-suite-prod-m50-run2.json` |
| 3 | 27.9 | 47.9 | 58.6 | 76 | 50 | 3100 | 0 | 0 | `B-graphql-populated-suite-prod-m50-run3.json` |
| 4 | 22.9 | 46.1 | 55.2 | 71 | 50 | 3100 | 0 | 0 | `B-graphql-populated-suite-prod-m50-run4.json` |
| 5 | 25.8 | 47 | 58.6 | 80 | 50 | 3100 | 0 | 0 | `B-graphql-populated-suite-prod-m50-run5.json` |

### `B-rest-populated`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 12.1 | 13.9 | 16 | 31 | 50 | 3100 | 0 | 0 | `B-rest-populated-suite-prod-m50-run1.json` |
| 2 | 12.1 | 15 | 19.1 | 117 | 50 | 3100 | 0 | 0 | `B-rest-populated-suite-prod-m50-run2.json` |
| 3 | 10.9 | 13.9 | 16.9 | 29 | 40 | 3100 | 0 | 0 | `B-rest-populated-suite-prod-m50-run3.json` |
| 4 | 10.1 | 13.9 | 16 | 33 | 42 | 3100 | 0 | 0 | `B-rest-populated-suite-prod-m50-run4.json` |
| 5 | 13.1 | 15 | 18 | 31 | 50 | 3100 | 0 | 0 | `B-rest-populated-suite-prod-m50-run5.json` |

### `C-graphql-deep`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 37.7 | 63.4 | 74.4 | 102 | 40 | 3100 | 0 | 0 | `C-graphql-deep-suite-prod-m50-run1.json` |
| 2 | 39.3 | 68.7 | 125.2 | 154 | 22 | 3100 | 0 | 0 | `C-graphql-deep-suite-prod-m50-run2.json` |
| 3 | 34.1 | 66 | 76 | 92 | 50 | 3100 | 0 | 0 | `C-graphql-deep-suite-prod-m50-run3.json` |
| 4 | 37 | 67.4 | 77.5 | 92 | 50 | 3100 | 0 | 0 | `C-graphql-deep-suite-prod-m50-run4.json` |
| 5 | 40 | 63.4 | 71.5 | 86 | 50 | 3100 | 0 | 0 | `C-graphql-deep-suite-prod-m50-run5.json` |

### `C-rest-deep`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 21.1 | 24.8 | 27.9 | 44 | 45 | 3100 | 0 | 0 | `C-rest-deep-suite-prod-m50-run1.json` |
| 2 | 15 | 22 | 24.8 | 43 | 50 | 3100 | 0 | 0 | `C-rest-deep-suite-prod-m50-run2.json` |
| 3 | 15 | 22 | 24.8 | 43 | 50 | 3100 | 0 | 0 | `C-rest-deep-suite-prod-m50-run3.json` |
| 4 | 15 | 22 | 24.8 | 46 | 50 | 3100 | 0 | 0 | `C-rest-deep-suite-prod-m50-run4.json` |
| 5 | 21.1 | 24.8 | 29.1 | 45 | 50 | 3100 | 0 | 0 | `C-rest-deep-suite-prod-m50-run5.json` |

### `D-graphql-create`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 | 7.9 | 10.1 | 29 | 50 | 3100 | 0 | 0 | `D-graphql-create-suite-prod-m50-run1.json` |
| 2 | 5 | 8.9 | 10.9 | 25 | 50 | 3100 | 0 | 0 | `D-graphql-create-suite-prod-m50-run2.json` |
| 3 | 5 | 8.9 | 10.1 | 33 | 48 | 3100 | 0 | 0 | `D-graphql-create-suite-prod-m50-run3.json` |
| 4 | 5 | 8.9 | 10.1 | 32 | 50 | 3100 | 0 | 0 | `D-graphql-create-suite-prod-m50-run4.json` |
| 5 | 5 | 8.9 | 10.9 | 31 | 22 | 3100 | 0 | 0 | `D-graphql-create-suite-prod-m50-run5.json` |

### `D-rest-create`

| Run | p50 ms | p95 ms | p99 ms | max ms | rate r/s | 2xx | 4xx | 5xx | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 5 | 7.9 | 10.1 | 28 | 44 | 3100 | 0 | 0 | `D-rest-create-suite-prod-m50-run1.json` |
| 2 | 6 | 8.9 | 10.9 | 24 | 50 | 3100 | 0 | 0 | `D-rest-create-suite-prod-m50-run2.json` |
| 3 | 5 | 7.9 | 10.9 | 26 | 44 | 3100 | 0 | 0 | `D-rest-create-suite-prod-m50-run3.json` |
| 4 | 5 | 7.9 | 10.1 | 26 | 47 | 3100 | 0 | 0 | `D-rest-create-suite-prod-m50-run4.json` |
| 5 | 5 | 8.9 | 10.9 | 30 | 50 | 3100 | 0 | 0 | `D-rest-create-suite-prod-m50-run5.json` |
