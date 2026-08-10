# 001 - Baseline

> Internal working notes. The public summary lives in
> [`../performance.md`](../performance.md).

- Date: 2026-06-14
- Branch / commit: `main` @ `e1a947b`
- Goal: capture the "before" numbers so every later optimization has a clear before/after comparison.

## Environment

- Machine / CPU: M1 Pro, 16 GB memory, arm64
- OS: macOS 15.6.1 (24G90)
- Node: v22.20.0, npm 11.7.0
- Browser: Google Chrome 149.0.7827.104
- LHCI: 0.15.1

## Raw measurements

### Bundle size (`npm run perf:size`)

```
dist/index.html                           0.45 kB │ gzip:   0.29 kB
dist/assets/index-C_avCGs3.css           20.27 kB │ gzip:   4.82 kB
dist/assets/SentimentChart-87WIJ9AO.js  130.77 kB │ gzip:  46.50 kB
dist/assets/index-DllT_Unb.js           511.52 kB │ gzip: 165.28 kB

assets/SentimentChart-87WIJ9AO.js  raw 127.70 KiB  gzip 45.34 KiB   brotli 40.08 KiB
assets/index-C_avCGs3.css          raw 19.79 KiB   gzip 4.70 KiB    brotli 4.09 KiB
assets/index-DllT_Unb.js           raw 499.53 KiB  gzip 161.10 KiB  brotli 139.52 KiB

Totals:
  raw:    647.03 KiB
  gzip:   211.14 KiB
  brotli: 183.70 KiB
```

### Lighthouse (`npm run perf:lh`)

- Performance: 95 (median of 3 runs: 88, 96, 95)
- FCP: 2.12s
- LCP: 2.48s
- INP / TBT: INP not available from this static lab run; TBT was 0ms
- CLS: 0.0001056911516247421
- Speed Index: 2.12s
- JS transfer: 167,342 bytes
- Report URL: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1781474513398-4905.report.html

### Web Vitals (dev, manual)

- TTFB: 22ms
- FCP: 916ms
- LCP: not flushed in this dev browser pass
- INP: not flushed in this dev browser pass
- CLS: not flushed in this dev browser pass

## Observations / hypotheses

- The main JS chunk is 161.10 KiB gzip, while the total JS/CSS gzip payload is 211.14 KiB.
- Lighthouse already reports 0ms TBT, so the first obvious wins are not CPU blocking; they are critical path and bundle shape.
- LCP is the weakest measured baseline at 2.48s, making route-level code splitting and font loading the next most useful optimizations.
- Vite warns that the main chunk is larger than 500 KiB after minification, which supports the planned route splitting and manual chunking work.

## Anomalies / env quirks

- `npm run perf:size` had to be run with an explicit `cd frontend` because the persisted shell session otherwise made npm look for a root `package.json`.
- The dev browser pass showed `CandlestickChart` fetch failures because the backend/data API was not running locally. That means live-feed long-task behavior and tick-to-paint latency were not captured in this baseline.
- The dev Web Vitals pass emitted TTFB and FCP only. LCP, INP, and CLS are therefore intentionally left as not captured instead of being guessed.
