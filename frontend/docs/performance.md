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
| Lighthouse (Performance, etc.) | `npm run perf:lh` | Builds, serves `dist/`, runs Lighthouse 3x, uploads a temporary public report. |
| Bundle composition | `npm run build:analyze` | Builds with the treemap visualizer enabled to inspect what ships and why. |
| Live Web Vitals (dev) | `npm run dev` | Logs LCP / INP / CLS / FCP / TTFB to the console as you interact. |

## Measurement environment

> Record the machine these numbers were captured on so the table stays credible.
> The method used is transferable and numbers are hardware-dependent.

- Machine: Apple M1 Pro, 16 GB memory, arm64
- OS: macOS 15.6.1 (24G90)
- Node: v22.20.0, npm 11.7.0
- Browser (Lighthouse): Google Chrome 149.0.7827.104, LHCI 0.15.1
- Network throttling: Lighthouse default (simulated Slow 4G, 4x CPU)

## Targets vs achieved

Status legend: `BASELINE` (before optimization) · `IN PROGRESS` · `MET` · `STRETCH MET`.

| Metric | Target | Stretch | Baseline | Current | Status |
| --- | --- | --- | --- | --- | --- |
| Lighthouse Performance | 90+ | 98+ | 95 | 95 | BASELINE |
| Initial JS (gzip) | < 250-350 KB | < 180 KB | 161.10 KiB | 161.10 KiB | BASELINE |
| LCP | < 2.0s | < 1.2s | 2.48s | 2.48s | BASELINE |
| INP | < 100ms | — | Not captured in lab run | Not captured in lab run | BASELINE |
| WebSocket tick-to-paint (p95) | < 50ms | < 25ms | _TBD in M7_ | _TBD in M7_ | BASELINE |
| Long tasks during live feed | none > 50ms | — | 0ms Lighthouse TBT; live feed not captured | 0ms Lighthouse TBT; live feed not captured | BASELINE |

## Optimization log

A high-level summary of each change and its measured effect. Detailed, dated
working notes (including dead ends) live in [`perf-lab/`](./perf-lab).

| Date | Change | Effect |
| --- | --- | --- |
| 2026-06-14 | Baseline captured | Performance 95, LCP 2.48s, initial JS 161.10 KiB gzip; route splitting and font work remain the clearest next optimizations. |
