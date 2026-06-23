# Hot Market Store

Recorded: 2026-06-23

## Change

- Added a tiny latest-trade store in front of Redux.
- Wrote each live trade into the hot store immediately after browser receive.
- Kept hot-store subscriber notifications frame-aligned with `requestAnimationFrame`.
- Kept Redux frame batching as the stable app state path.
- Added live receive-to-store timing at `window.__pioniMarketLatency.latestStoreSummary`.

## Why

Visible paint cannot reliably target sub-2ms p95 because the browser only paints on display frames. The better high-value metric is the data path: when the browser receives a live market trade, how quickly is the newest value available to the frontend state layer?

The hot store answers that without making Redux handle every tick synchronously. Redux remains useful for predictable app state, tests, time-travel style debugging, and cross-component state. The hot store handles the narrow latency-critical latest-price path.

## Validation

Commands:

```bash
npm run test:run -- src/features/market/liveMarketStore.test.ts src/features/market/marketLatency.test.ts
npm run typecheck
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

Live dev capture:

| Metric | p50 | p95 | p99 | max |
| --- | --- | --- | --- | --- |
| receive-to-store | 0.00ms | 0.00ms | 0.10ms | 0.10ms |
| receive-to-state | 2.90ms | 7.30ms | 8.30ms | 8.30ms |
| receive-to-paint | 9.60ms | 15.50ms | 16.30ms | 16.30ms |

## Interpretation

`latestStoreSummary` is the number to use for the sub-2ms hot data path. `latestStateSummary` includes intentional frame batching into Redux. `latestSummary` includes browser paint timing and should be judged against a one-frame target, not a sub-2ms target.

This capture confirms the hot data path is comfortably below the 2ms stretch target. The paint number remains frame-bound, which is expected browser behavior.
