# Redux Frame Batching

Recorded: 2026-06-22

## Change

- Added a Redux action that accepts the latest trade per symbol for a browser frame.
- Replaced the single-trade rAF buffer in the trading page with a per-symbol frame buffer.
- Kept Redux as the source of truth for the live price UI.

## Why

The live tick path should not dispatch once per incoming tick during bursts. Keeping only the newest trade for each symbol per frame preserves the visible state users care about while avoiding unnecessary Redux subscriber work.

## Validation

Commands:

```bash
npm run typecheck
npm run lint
npm run test:run -- src/features/market/marketLatency.test.ts src/features/market/marketSlice.test.ts src/features/market/tickToState.perf.test.ts
```

Live capture comparison:

| Metric | Before | After |
| --- | --- | --- |
| p50 | 35.00ms | 9.40ms |
| p95 | 64.09ms | 15.90ms |
| p99 | 66.00ms | 38.90ms |
| max | 1551.50ms | 38.90ms |

The p95 result is now below one 60Hz frame budget. Further visible-paint gains below 3ms are unlikely without changing what is measured, because browser paint is gated by the display frame pipeline.
