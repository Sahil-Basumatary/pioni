# Observability

Local metrics stack for the Pioni platform: Prometheus scrapes each service's `/metrics`
endpoint and Grafana renders a provisioned RED dashboard.

## Run

```bash
docker compose up -d prometheus grafana
```

Then start the app services (gateway, sentiment, market-data, orders, portfolio) on the
host as usual. Prometheus reaches them through `host.docker.internal`.

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (anonymous viewing enabled; admin login `admin` / `admin`)

The "Pioni Platform Overview" dashboard loads automatically under the Pioni folder. No
manual import or account is required.

## What is measured

Every service is instrumented through `common.instrument_app`, which exposes:

- `http_requests_total{service,method,path,status}` — request counter
- `http_request_duration_seconds{service,method,path}` — latency histogram

Labels use the matched route template (`/portfolios/{portfolio_id}`), never the raw path,
to keep Prometheus label cardinality bounded.

### Domain metrics (orders service)

Beyond the cross-cutting HTTP signals, the orders service emits trading-specific metrics
from `orders.metrics`, recorded around the matching engine:

- `orders_submitted_total{symbol,side,order_type,status}` — orders reaching the engine, by outcome
- `trades_executed_total{symbol,side}` — fills produced (one per maker matched)
- `trade_volume_base_total{symbol}` — executed quantity in the base asset
- `trade_notional_total{symbol}` — executed notional in the quote asset (`quantity * price`)
- `matching_engine_match_duration_seconds{symbol}` — engine latency histogram

Latency is timed in the service layer around `engine.submit()` so the matching engine stays
pure domain logic. `symbol` is a safe label here because the tradable universe is bounded;
unbounded identifiers (order/portfolio IDs) are deliberately excluded.

## Dashboard panels

The dashboard follows the RED method (Rate, Errors, Duration):

- Services up, total request rate, 5xx error rate, p99 latency (top stats)
- Request rate by service
- Requests by status code
- Latency percentiles p50/p95/p99
- Error rate by service

A **Trading Activity** section surfaces the domain metrics:

- Orders/sec, trades/sec, matching p99, notional/sec (stats)
- Orders by status
- Trades by symbol
- Matching engine latency percentiles p50/p95/p99
- Executed volume (base) by symbol

## Scaling note

This stack is single-node by design. The instrumentation is unchanged when swapping the
storage layer for Thanos, Mimir, or a managed backend, and when moving target discovery
to Kubernetes service discovery in a cluster deployment.

## Multiple workers

When a service runs multiple worker processes, set `PROMETHEUS_MULTIPROC_DIR` to a writable
directory so per-process samples are merged on scrape. With a single worker this is unset
and metrics come straight from the process.
