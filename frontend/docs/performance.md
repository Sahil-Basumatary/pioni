# Frontend Performance

A measured, reproducible account of how the Pioni frontend is kept fast. The
guiding principle is that every number here is something I **measured, moved, and can
reproduce on demand**.

The production preview (`vite build` followed by a static serve of `dist/`) is
the single source of truth. Development-mode numbers are noisier and are used
only for live observation, never for the table below.

## How to reproduce

All commands run from `frontend/`.

| Goal | Command | What it does |
| --- | --- | --- |
| Bundle size (gzip + brotli) | `npm run perf:size` | Builds, then reports per-asset and total compressed transfer size. |
| Bundle budget gate | `npm run perf:budget` | Builds, reports compressed sizes, and fails if the frontend exceeds the committed budgets. |
| Lighthouse (Performance, etc.) | `npm run perf:lh` | Builds, serves `dist/`, runs Lighthouse 3x, uploads a temporary public report. |
| Bundle composition | `npm run build:analyze` | Builds with the treemap visualizer enabled to inspect what ships and why. |
| Tick-to-state latency | `npm run perf:tick-to-state` | Parses synthetic WebSocket trades, dispatches them into Redux, and measures state update latency. |
| Tick-to-paint latency | `npm run perf:tick-to-paint` | Builds, serves `dist/`, emits synthetic WebSocket trades, and measures visible price update latency. |
| Live market latency (dev) | `VITE_MARKET_LATENCY_DEBUG=true npm run dev` | Adds real WebSocket hop timing and logs rolling receive-to-paint p50 / p95 / p99 while the trading page receives live ticks. |
| Live Web Vitals (dev) | `npm run dev` | Logs LCP / INP / CLS / FCP / TTFB to the console as you interact. |

## Measurement environment

> Record the machine these numbers were captured on so the table stays credible.
> The method used is transferable and numbers are hardware-dependent.

- Machine: Apple M1 Pro, 16 GB memory, arm64
- OS: macOS 15.6.1 (24G90)
- Node: v22.20.0, npm 11.7.0
- Browser (Lighthouse): Google Chrome 149.0.7827.104, LHCI 0.15.1
- Browser (tick-to-paint): Cypress Electron 138, headless
- Runtime (tick-to-state): Vitest on Node.js
- Network throttling: Lighthouse default (simulated Slow 4G, 4x CPU)

## Targets vs achieved

Status legend: `BASELINE` (before optimization) · `IN PROGRESS` · `MET` · `STRETCH MET`.

| Metric | Target | Stretch | Baseline | Current | Status |
| --- | --- | --- | --- | --- | --- |
| Lighthouse Performance | 90+ | 98+ | 95 | 96 | MET |
| Initial JS (gzip) | < 250-350 KB | < 180 KB | 161.10 KiB | 155.10 KiB `/trading` route; 99.46 KiB entry chunk | STRETCH MET |
| LCP | < 2.0s | < 1.2s | 2.48s | 1.97s | MET |
| INP | < 100ms | — | Not captured in lab run | Not captured in lab run | BASELINE |
| WebSocket tick-to-state (p95) | < 1ms | < 0.5ms | Not measured yet | 0.0307ms | STRETCH MET |
| WebSocket tick-to-paint (p95) | < 50ms | < 25ms | Not measured yet | 17.60ms | STRETCH MET |
| Live market receive-to-paint (p95) | < 50ms | < 25ms | 64.09ms dev capture | 15.90ms dev capture | STRETCH MET |
| Long tasks during live feed | none > 50ms | — | 0ms Lighthouse TBT; live feed not captured | 0ms Lighthouse TBT; live feed not captured | MET |

## CI Budgets

The CI workflow checks production build output after `npm run build` and fails if the
frontend regresses beyond these limits:

- Total JavaScript/CSS gzip: 180 KiB
- Total JavaScript/CSS brotli: 160 KiB
- Entry chunk gzip: 110 KiB
- Trading route gzip: 65 KiB
- Sentiment route gzip: 12 KiB
- Sentiment chart gzip: 5 KiB

## Optimization log

A high-level summary of each change and its measured effect. Detailed, dated
working notes (including dead ends) live in [`perf-lab/`](./perf-lab).

| Date | Change | Effect |
| --- | --- | --- |
| 2026-06-14 | Baseline captured | Performance 95, LCP 2.48s, initial JS 161.10 KiB gzip; route splitting and font work remain the clearest next optimizations. |
| 2026-06-16 | Route-level code splitting | Split trading and sentiment pages behind `React.lazy`; entry JS dropped from 161.10 KiB to 99.31 KiB gzip, while the default `/trading` route now loads 154.89 KiB gzip. LCP improved to 2.27s; CLS became noisier around the route fallback and needs a tighter skeleton. |
| 2026-06-17 | Vite build tuning | Set the production target to `es2020`, added gzip/brotli assets, and gated the bundle treemap behind `ANALYZE=true`. Manual vendor/chart chunks were tested, but the default route loaded more JavaScript, so the final config keeps Rollup's route chunks. |
| 2026-06-17 | Font loading | Removed the Google Fonts stylesheet import and kept the UI on a local/system font stack. Lighthouse reported zero font requests, FCP improved to 1.51s, and LCP reached 1.97s. |
| 2026-06-17 | Runtime render hardening | Memoized hot trading components, stabilized trading route callbacks, and added a dev long-task observer. Lighthouse stayed stable at 0ms TBT, with LCP holding at 1.97s. |
| 2026-06-17 | Tick-to-paint benchmark | Added a production-preview Cypress benchmark for synthetic WebSocket trades. The measured p95 from trade emit to visible price paint was 17.60ms across 120 measured ticks. |
| 2026-06-18 | Tick-to-state benchmark | Added a separate data-path benchmark for synthetic WebSocket trades. Parsing and Redux update latency measured 0.0307ms p95 across 10,000 measured ticks. |
| 2026-06-18 | Chart runtime cleanup | Removed Chart.js from the sentiment trend chart and replaced it with a tiny SVG line chart. The lazy sentiment chart chunk dropped from about 46.69 KiB gzip to 0.72 KiB gzip. |
| 2026-06-18 | CI budget gate | Added a production bundle budget check to CI so route chunks, total compressed size, and the sentiment chart chunk cannot quietly regress. |
| 2026-06-20 | Live market latency instrumentation | Added opt-in live WebSocket timing from market-data publish through gateway send, browser receive, and the next painted frame. |
| 2026-06-22 | Redux frame batching | Kept Redux as the market state source while batching live trades into one per-frame action keyed by symbol. Live receive-to-paint p95 improved from 64.09ms to 15.90ms in dev capture. |
