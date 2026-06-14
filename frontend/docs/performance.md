# Frontend Performance

A measured, reproducible account of how the Pioni frontend is kept fast. The
guiding principle is that every number here is something I **measured, moved, and can
reproduce on demand**

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
> The method used is transferable and numbers are hardware-dependent

- Machine: _TBD_
- OS: _TBD_
- Node: _TBD_
- Browser (Lighthouse): _TBD_
- Network throttling: Lighthouse default (simulated Slow 4G, 4x CPU)

## Targets vs achieved

Status legend: `BASELINE` (before optimization) · `IN PROGRESS` · `MET` · `STRETCH MET`.

| Metric | Target | Stretch | Baseline | Current | Status |
| --- | --- | --- | --- | --- | --- |
| Lighthouse Performance | 90+ | 98+ | _TBD_ | _TBD_ | BASELINE |
| Initial JS (gzip) | < 250-350 KB | < 180 KB | _TBD_ | _TBD_ | BASELINE |
| LCP | < 2.0s | < 1.2s | _TBD_ | _TBD_ | BASELINE |
| INP | < 100ms | — | _TBD_ | _TBD_ | BASELINE |
| WebSocket tick-to-paint (p95) | < 50ms | < 25ms | _TBD_ | _TBD_ | BASELINE |
| Long tasks during live feed | none > 50ms | — | _TBD_ | _TBD_ | BASELINE |

## Optimization log

A high-level summary of each change and its measured effect. Detailed, dated
working notes (including dead ends) live in [`perf-lab/`](./perf-lab).

| Date | Change | Effect |
| --- | --- | --- |
| _TBD_ | Measurement harness added | Establishes the ruler before any cuts. |
