# Load test results

Full service-path load tests (HTTP + validation + matching + DB), distinct from the pure
in-process matching-engine micro-benchmarks in `services/orders/benchmarks/RESULTS.md`.

Record each run with enough context to reproduce it.

## Template

### <date> — <scenario>

- **Command:** `VUS=... DURATION=... k6 run loadtest/<script>.js`
- **Environment:** local / Render / other; single-process uvicorn vs gunicorn workers; machine spec
- **Stack:** Postgres, Redis, RabbitMQ (versions / local vs managed)

| Metric | Value |
| --- | --- |
| Requests/sec (throughput) | |
| p50 latency | |
| p95 latency | |
| p99 latency | |
| Error rate | |
| Thresholds passed | yes / no |

**Notes:** bottleneck observed, any tuning applied, follow-ups.

---

## Gateway market results after optimisation 

Device - Apple MacBook pro m1 pro
Stack: local Postgres/Redis/RabbitMQ + market-data
service. Load generated from the same device, so k6, market-data and the gateway workers all
contend for the same cores

The market-data source answers `/prices` in ~0.5ms; all latency below is gateway-side.

| Stage | Config | VUs | Throughput | p50 | p95 | p99 | min | max | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | 1 process (`--reload`), proxy every request | 50 | 172/s | 151ms | — | — | 1.81ms | — | 0% |
| + edge cache | 1 process, TTL cache + single-flight | 50 | 1,256/s | 24ms | 83ms | 241ms | 515µs | — | 0% |
| + workers | 4 workers | 50 | 1,665/s | 7.77ms | 30ms | 119ms | 504µs | 39.3s¹ | 0% |
| Ceiling | 8 workers, prewarm off | 150 | **4,076/s** | 16.7ms² | 109ms² | 254ms | **486µs** | 829ms | 0% |

¹ A one-off 38s freeze traced to the startup prewarm task (first FinBERT inference) racing live
traffic on the event loop. Disabling prewarm during the run removed it (max → 829ms), confirming
the cause. Production follow-up: gate prewarm behind readiness so a worker warms *before* it
accepts traffic.

² p50/p95 are higher in the ceiling row only because it runs at 3× the concurrency (150 vs 50 VUs);
the throughput is the headline. At 50 VUs the 8-worker p50 sits in the low single-digit ms.

### What changed and why

- **Bisection first.** A 1-VU run showed a single request costs ~3.5ms, while 50 VUs hit 151ms —
  proving the 150ms was queuing behind a single event-loop core, not slow work.
- **Edge cache (`response_cache.TTLByteCache`).** `/prices` is a live snapshot already streamed to
  clients over WebSocket, so serving a sub-second-stale copy is invisible. The cache stores the raw
  upstream bytes (skips a JSON decode/re-encode) and a per-key lock collapses a concurrent miss
  stampede into a single upstream fetch. Cache hits are pure memory reads → sub-millisecond.
- **Horizontal workers.** Multiple uvicorn workers spread concurrent requests across cores, which
  is what collapsed the queuing tail.

### Remaining ceiling

At 4,076/s ≈ 8 × ~510/s, each cache hit costs ~2ms of pure framework overhead. That is the
`BaseHTTPMiddleware` tax (Starlette wraps each `@app.middleware("http")` in an anyio task group +
streaming shim). Converting the hot middleware to pure ASGI is the next lever.

### Reproduce

```bash
make infra && make db-upgrade
make dev-market-data                                   # :8002, feeds /prices
RATE_LIMIT_ENABLED=false PREWARM_ENABLED=false make dev-gateway-perf   # 8 workers
VUS=150 RAMP=20s DURATION=1m make load-market
```
