# Live Market Latency

Recorded: 2026-06-20

## Change

- Added opt-in timing metadata to live trade payloads.
- Added a frontend collector gated by `VITE_MARKET_LATENCY_DEBUG=true`.
- Exposed rolling samples at `window.__pioniMarketLatency` for local inspection.

## Method

Run the live stack, then start the frontend with:

```bash
VITE_MARKET_LATENCY_DEBUG=true npm run dev
```

Open the trading page and subscribe to a live symbol. Every 50 measured paints, the browser logs rolling receive-to-paint p50, p95, p99, and max.

## Timing Fields

- `exchange_at_ms`: exchange event timestamp from the trade payload.
- `market_received_at_ms`: market-data service time when the trade is handled.
- `market_published_at_ms`: market-data service time before Redis publish.
- `gateway_received_at_ms`: gateway time when Redis delivers the trade.
- `gateway_sent_at_ms`: gateway time before WebSocket broadcast.
- `browser_received_at_ms`: browser wall-clock time after WebSocket parse.
- `browser_received_perf_ms`: browser monotonic time after WebSocket parse.

## Captured Result

Baseline dev capture before Redux frame batching:

| Metric | Value |
| --- | --- |
| samples | 337 |
| p50 | 35.00ms |
| p95 | 64.09ms |
| p99 | 66.00ms |
| max | 1551.50ms |

Redux frame batching dev capture:

| Metric | Value |
| --- | --- |
| samples | 82 |
| p50 | 9.40ms |
| p95 | 15.90ms |
| p99 | 38.90ms |
| max | 38.90ms |

## Interpretation

Cross-service timings use wall-clock epoch milliseconds, so they depend on the machines running market-data, gateway, and browser having reasonably synchronized clocks. Browser receive-to-paint uses `performance.now()` and is the most reliable client-side number for judging UI responsiveness.

The current p95 is under one 60Hz frame budget, which is the practical target for visible browser UI updates. A sub-3ms receive-to-paint p95 is not a realistic visible-paint target on normal displays; that kind of number belongs to receive-to-state or receive-to-store measurements, not actual painted UI.
