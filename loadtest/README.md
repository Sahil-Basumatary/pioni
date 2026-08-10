# Load testing

[k6](https://k6.io) scenarios that measure the two paths that are relevant for a trading platform:

| Scenario | Script | Target | What it proves |
| --- | --- | --- | --- |
| Market read | `gateway_market_read.js` | Gateway `GET /market/prices` (`:8000`) | Public read fan-out latency/error rate through the real edge |
| Order submit | `orders_submit.js` | Orders `POST /orders` (`:8003`) | End-to-end order throughput: validation → matching → DB write → event publish |

Order submission runs directly against the orders service. Gateway authentication is covered by
functional tests and is outside this throughput measurement. Each virtual user gets a separate
paper portfolio and symbol, avoiding artificial contention on one portfolio row or matching lock.

## Prerequisites

1. Install k6: `brew install k6` (macOS) or see the k6 install docs.
2. Start infrastructure: `make infra` (Postgres, Redis, RabbitMQ).
3. Apply migrations: `make db-upgrade`.
4. Run the services under test in separate terminals:
   - `make dev-orders` (port 8003)
   - `make dev-portfolio` (port 8004)
   - `make dev-market-data` (port 8002) — feeds `/market/prices`
   - For the market-read scenario, run the gateway with rate limiting **off** so the test
     measures the read path rather than the limiter (30 req/60s would 429 almost everything):
     `RATE_LIMIT_ENABLED=false make dev-gateway`

> The default single-process `uvicorn --reload` dev server is the floor, not the ceiling. For a
> throughput number closer to production, run the service without `--reload` and with multiple
> workers (e.g. `uvicorn orders.main:app --port 8003 --workers 4`).

## Run

```bash
make load-orders      # order submission throughput
make load-market      # gateway market read path
```

Or invoke k6 directly to tune the profile via environment variables:

```bash
VUS=100 RAMP=30s DURATION=2m k6 run loadtest/orders_submit.js
```

| Env | Default | Meaning |
| --- | --- | --- |
| `VUS` | `50` | Peak concurrent virtual users |
| `RAMP` | `30s` | Ramp-up duration to peak |
| `DURATION` | `1m` | Steady-state duration at peak |
| `ORDERS_URL` | `http://localhost:8003` | Orders service base URL |
| `PORTFOLIO_URL` | `http://localhost:8004` | Portfolio service base URL |
| `GATEWAY_URL` | `http://localhost:8000` | Gateway base URL |
| `SYMBOLS` | 6 real pairs | Comma-separated symbols to spread orders across; add more (even synthetic, e.g. `LT1USDT,LT2USDT,...`) to reduce per-symbol lock contention and probe the concurrency ceiling |

## Thresholds (pass/fail gates)

Each script encodes thresholds so a run exits non-zero if the system regresses:

- Market read: `http_req_failed < 1%`, `p95 < 200ms`, `p99 < 500ms`
- Order submit: `http_req_failed < 2%`, `order_submit p95 < 200ms`, `p99 < 500ms`

These thresholds are initial limits for local single-process `uvicorn`. Production hardware needs
its own measured baseline.

## Recording results

After a run, capture the headline numbers in `RESULTS.md`. The matching-engine micro-benchmarks
(pure in-process, no HTTP/DB) live separately in `services/orders/benchmarks/RESULTS.md`; this
directory measures the full service path on top of that.
