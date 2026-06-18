# Tick-to-State Latency

Recorded: 2026-06-18

## Method

- Command: `npm run perf:tick-to-state`
- Runtime: Vitest on Node.js
- Input: 1000 warmup synthetic BTC trade messages, followed by 10000 measured messages
- Measurement: timestamp before parsing a synthetic WebSocket trade payload, dispatch it into the real Redux store, then stop the timer after the reducer update returns
- Verification: the latest-trade selector must read back the final measured trade

## Result

| Metric | Value |
| --- | --- |
| p50 | 0.0193ms |
| p95 | 0.0307ms |
| p99 | 0.1209ms |
| max | 3.8648ms |

## Interpretation

This isolates the client data path from browser rendering. It measures parsing and Redux state update latency, not network latency, React commit time, or display refresh timing.
