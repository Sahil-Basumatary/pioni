## Route Code Splitting

- Date: 2026-06-16
- Branch / commit: `main` after `91e3cb6`
- Goal: lazy-load page routes so chart-heavy code stays out of the main load.

## Change

- Replaced eager `SentimentPage` and `TradingPage` imports with `React.lazy`.
- Wrapped routes in `Suspense`.
- Added a lightweight route fallback shaped like the trading page to reduce route-swap layout movement.

## Bundle size (`npm run perf:size`)

```
dist/index.html                           0.45 kB │ gzip:   0.29 kB
dist/assets/SentimentPage-BbUDa7HB.css    0.51 kB │ gzip:   0.31 kB
dist/assets/index-Cadf9NeI.css           19.91 kB │ gzip:   4.75 kB
dist/assets/SentimentPage-LymxroOh.js    24.73 kB │ gzip:   6.67 kB
dist/assets/SentimentChart-Bpk-ds6l.js  130.77 kB │ gzip:  46.50 kB
dist/assets/TradingPage-B3MNHHWR.js     176.66 kB │ gzip:  57.05 kB
dist/assets/index-C7S6B71_.js           311.24 kB │ gzip: 101.83 kB

assets/SentimentChart-Bpk-ds6l.js  raw 127.70 KiB  gzip 45.34 KiB  brotli 40.02 KiB
assets/SentimentPage-BbUDa7HB.css  raw 0.50 KiB    gzip 0.30 KiB   brotli 0.23 KiB
assets/SentimentPage-LymxroOh.js   raw 24.15 KiB   gzip 6.48 KiB   brotli 5.71 KiB
assets/TradingPage-B3MNHHWR.js     raw 172.52 KiB  gzip 55.58 KiB  brotli 48.37 KiB
assets/index-C7S6B71_.js           raw 303.95 KiB  gzip 99.31 KiB  brotli 86.73 KiB
assets/index-Cadf9NeI.css          raw 19.44 KiB   gzip 4.63 KiB   brotli 4.04 KiB

Totals:
  raw:    648.26 KiB
  gzip:   211.65 KiB
  brotli: 185.11 KiB
```

## Lighthouse (`npm run perf:lh`)

- Performance: 95 (runs: 95, 97, 90)
- FCP: 1.97s
- LCP: 2.27s
- TBT: 0ms
- CLS: 0.09276966801723624
- Speed Index: 1.97s
- JS transfer: 161,952 bytes
- Report URL: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1781634063387-15360.report.html

## Interpretation

- The entry JS chunk dropped from 161.10 KiB gzip to 99.31 KiB gzip, a 61.79 KiB reduction.
- The default `/trading` route still needs the trading route chunk, so its first-route JS cost is 154.89 KiB gzip (`99.31 + 55.58`).
- LCP improved from 2.48s to 2.27s, but it is still above my 2.0s target for now.
- CLS is noisier after lazy routing because the trading chart/fallback swap is still not perfectly stable.

## Next things to check

- Make Vite chunking more explicit so shared React, Redux, and chart code is easier to reason about.
- Fix Google Fonts loading, which already appeared as a layout-shift cause in Lighthouse.
- If CLS stays near 0.09 after the font fix, make the route fallback reuse the real trading skeleton components instead of approximating the layout.
