## Runtime Render Hardening

- Date: 2026-06-17
- Branch / commit: `main` after `acda4bb`
- Goal: reduce unnecessary React work while live trading updates are flowing.

## Change

- Memoized the trading price ticker.
- Memoized the symbol selector.
- Kept the selected trade selector stable across ticker renders.
- Stabilized the trading page callbacks passed into child components.
- Added a development-only long-task observer beside the Web Vitals console logs.

## Why this matters

The trading chart already updates imperatively through `lightweight-charts`, and trade events are already coalesced to one Redux dispatch per animation frame. These changes keep parent renders from invalidating hot child props when the selected symbol has not changed.

## Bundle size (`npm run perf:size`)

```
dist/index.html                              0.45 kB │ gzip:   0.29 kB
dist/assets/index-B940iO4J.css.br            4.07 kB
dist/assets/index-B940iO4J.css.gz            4.65 kB
dist/assets/SentimentPage-BtfaE8fR.js.br     5.85 kB
dist/assets/SentimentPage-BtfaE8fR.js.gz     6.64 kB
dist/assets/SentimentChart-BeUg3LED.js.br   41.11 kB
dist/assets/SentimentChart-BeUg3LED.js.gz   46.62 kB
dist/assets/TradingPage-C2lxiSrY.js.br      49.59 kB
dist/assets/TradingPage-C2lxiSrY.js.gz      56.95 kB
dist/assets/index-Dq93sfmx.js.br            88.92 kB
dist/assets/index-Dq93sfmx.js.gz           101.85 kB
dist/assets/SentimentPage-BbUDa7HB.css       0.51 kB │ gzip:   0.31 kB
dist/assets/index-B940iO4J.css              18.75 kB │ gzip:   4.66 kB
dist/assets/SentimentPage-BtfaE8fR.js       24.73 kB │ gzip:   6.67 kB
dist/assets/SentimentChart-BeUg3LED.js     131.09 kB │ gzip:  46.69 kB
dist/assets/TradingPage-C2lxiSrY.js        176.80 kB │ gzip:  57.09 kB
dist/assets/index-Dq93sfmx.js              311.65 kB │ gzip: 101.99 kB

assets/SentimentChart-BeUg3LED.js  raw 128.01 KiB  gzip 45.52 KiB  brotli 40.14 KiB
assets/SentimentPage-BbUDa7HB.css  raw 0.50 KiB    gzip 0.30 KiB   brotli 0.23 KiB
assets/SentimentPage-BtfaE8fR.js   raw 24.15 KiB   gzip 6.48 KiB   brotli 5.71 KiB
assets/TradingPage-C2lxiSrY.js     raw 172.66 KiB  gzip 55.62 KiB  brotli 48.43 KiB
assets/index-B940iO4J.css          raw 18.31 KiB   gzip 4.54 KiB   brotli 3.98 KiB
assets/index-Dq93sfmx.js           raw 304.34 KiB  gzip 99.46 KiB  brotli 86.84 KiB

Totals:
  raw:    647.98 KiB
  gzip:   211.93 KiB
  brotli: 185.33 KiB
```

## Lighthouse (`npm run perf:lh`)

- Performance: 96 (runs: 96, 96, 96)
- FCP: 1.51s
- LCP: 1.97s
- TBT: 0ms
- CLS: 0.09650107434238372
- Speed Index: 1.51s
- JS transfer: 162,062 bytes
- Report URL: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1781690524561-20412.report.html

## Checks

- `npm run typecheck`
- `npm run test:run`
- `npm run perf:size`
- `npm run perf:lh`
- Production bundle scan confirmed the development metric strings are not present in `dist`.

## Next things to check

- Add a synthetic tick-to-paint benchmark so live update latency can be measured directly instead of inferred from Lighthouse.
- Revisit the route fallback layout because CLS is still near 0.096.
