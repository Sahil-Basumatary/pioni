# Worker Parsing Evaluation

Recorded: 2026-06-23

## Question

Should live market WebSocket parsing move into a Web Worker?

## Current Evidence

- Synthetic tick-to-state p95 is `0.0307ms` across 10,000 measured ticks.
- Synthetic tick-to-paint p95 is `17.60ms`.
- Live receive-to-paint p95 improved from `64.09ms` to `15.90ms` after Redux frame batching.
- Live receive-to-store is now instrumented separately at `window.__pioniMarketLatency.latestStoreSummary`.
- Live receive-to-state is now instrumented separately at `window.__pioniMarketLatency.latestStateSummary`.

## Decision

Do not add Worker parsing yet.

The measured client bottleneck is frame scheduling and paint timing, not JSON parsing or Redux reducer cost. The immediate hot store gives the app a sub-2ms data-path target without Worker message-passing overhead. A Worker would add more test surface and more production failure modes before the data shows it is needed.

## When To Revisit

Reconsider Worker parsing if live receive-to-state p95 is consistently above one frame, if p99 spikes during bursty symbols while CPU is busy, or if browser profiles show JSON parsing / normalization as a meaningful main-thread cost.

## Validation

Commands:

```bash
npm run test:run -- src/features/market/marketLatency.test.ts
npm run perf:tick-to-state
```

Manual live capture:

```bash
VITE_MARKET_LATENCY_DEBUG=true npm run dev
```

Then inspect:

```js
window.__pioniMarketLatency.latestStoreSummary
window.__pioniMarketLatency.latestStateSummary
window.__pioniMarketLatency.latestSummary
```
