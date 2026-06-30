# Observability

Local observability stack for the Pioni platform: Prometheus scrapes each service's
`/metrics` endpoint, Grafana renders a provisioned RED dashboard, and Jaeger collects
distributed traces over OTLP.

## Run

```bash
docker compose up -d prometheus grafana jaeger
```

Then start the app services (gateway, sentiment, market-data, orders, portfolio) on the
host as usual. Prometheus reaches them through `host.docker.internal`.

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (anonymous viewing enabled; admin login `admin` / `admin`)
- Jaeger: http://localhost:16686

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

## Distributed tracing

Tracing is opt-in. Set `TRACING_ENABLED=true` (and start the `jaeger` container) before
launching the services; with the flag unset the instrumentation is a complete no-op.

Every service calls `common.instrument_app_tracing`, which:

- exports spans to Jaeger over OTLP/HTTP (`OTEL_EXPORTER_OTLP_ENDPOINT`, default
  `http://localhost:4318`)
- auto-instruments FastAPI (incoming requests) and `httpx` (outgoing calls), so the
  gateway's downstream requests propagate W3C `traceparent` context and a single user
  request shows up as one connected trace across services
- excludes `/metrics` and `/health*` from tracing to keep the trace list signal-heavy

### Correlation

The three signals are joined so you can pivot between them:

- `request.id` (the existing per-request correlation ID) is set as a span attribute
- `trace_id` and `span_id` are injected into every JSON log line when a span is active

So a log line points at its trace, a trace points back at the request ID, and metrics and
traces share the same service boundaries.

## Scaling note

This stack is single-node by design. The instrumentation is unchanged when swapping the
storage layer for Thanos, Mimir, or a managed backend, and when moving target discovery
to Kubernetes service discovery in a cluster deployment.

## Multiple workers

When a service runs multiple worker processes, set `PROMETHEUS_MULTIPROC_DIR` to a writable
directory so per-process samples are merged on scrape. With a single worker this is unset
and metrics come straight from the process.
