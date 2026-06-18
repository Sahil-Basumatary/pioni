# Tick-to-Paint Latency

Recorded: 2026-06-17

## Method

- Command: `npm run perf:tick-to-paint`
- Browser: Cypress Electron 138, headless
- App mode: production build served with `vite preview`
- Route: `/trading`
- Input: 20 warmup synthetic BTC trades, followed by 120 measured synthetic BTC trades
- Measurement: timestamp before the synthetic WebSocket trade is emitted, then wait for the next painted frame with two `requestAnimationFrame` callbacks and verify the live price text changed

## Result

| Metric | Value |
| --- | --- |
| p50 | 16.60ms |
| p95 | 17.60ms |
| p99 | 17.80ms |
| max | 17.80ms |

## Interpretation

The p95 result is below the 50ms target, so the hot path from synthetic trade receipt to visible price update is fast enough for the current trading UI. The benchmark isolates client render latency and does not include real network jitter or exchange feed latency.
