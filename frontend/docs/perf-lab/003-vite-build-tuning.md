## Vite Build Tuning

- Date: 2026-06-17
- Branch / commit: `main` after `5edcdfc`
- Goal: to make production builds easier to inspect and ship precompressed static assets without increasing the first route cost.

## Change

- Set the production build target to `es2020`.
- Added gzip and brotli asset generation for production builds.
- Added a bundle treemap that only runs with `ANALYZE=true`.
- Tested manual vendor and chart chunks, but kept Rollup's route chunking because forced chunks increased the default `/trading` transfer.

## Bundle size (`npm run perf:size`)

```
dist/index.html                              0.45 kB │ gzip:   0.29 kB
dist/assets/index-BXojyfys.css.br            4.13 kB
dist/assets/index-BXojyfys.css.gz            4.72 kB
dist/assets/SentimentPage-JjvkxWyM.js.br     5.83 kB
dist/assets/SentimentPage-JjvkxWyM.js.gz     6.64 kB
dist/assets/SentimentChart-BtxmqmRb.js.br   41.18 kB
dist/assets/SentimentChart-BtxmqmRb.js.gz   46.62 kB
dist/assets/TradingPage-qS3UIQGY.js.br      49.53 kB
dist/assets/TradingPage-qS3UIQGY.js.gz      56.91 kB
dist/assets/index-CG1O7Sr2.js.br            88.96 kB
dist/assets/index-CG1O7Sr2.js.gz           101.85 kB
dist/assets/SentimentPage-BbUDa7HB.css       0.51 kB │ gzip:   0.31 kB
dist/assets/index-BXojyfys.css              18.82 kB │ gzip:   4.72 kB
dist/assets/SentimentPage-JjvkxWyM.js       24.73 kB │ gzip:   6.67 kB
dist/assets/SentimentChart-BtxmqmRb.js     131.09 kB │ gzip:  46.69 kB
dist/assets/TradingPage-qS3UIQGY.js        176.66 kB │ gzip:  57.05 kB
dist/assets/index-CG1O7Sr2.js              311.65 kB │ gzip: 102.00 kB

assets/SentimentChart-BtxmqmRb.js  raw 128.01 KiB  gzip 45.52 KiB  brotli 40.22 KiB
assets/SentimentPage-BbUDa7HB.css  raw 0.50 KiB    gzip 0.30 KiB   brotli 0.23 KiB
assets/SentimentPage-JjvkxWyM.js   raw 24.15 KiB   gzip 6.48 KiB   brotli 5.69 KiB
assets/TradingPage-qS3UIQGY.js     raw 172.52 KiB  gzip 55.58 KiB  brotli 48.37 KiB
assets/index-BXojyfys.css          raw 18.38 KiB   gzip 4.61 KiB   brotli 4.03 KiB
assets/index-CG1O7Sr2.js           raw 304.34 KiB  gzip 99.46 KiB  brotli 86.88 KiB

Totals:
  raw:    647.92 KiB
  gzip:   211.96 KiB
  brotli: 185.42 KiB
```

## Lighthouse (`npm run perf:lh`)

- Performance: 94 (runs: 94, 94, 95)
- FCP: 1.96s
- LCP: 2.28s
- TBT: 0ms
- CLS: 0.09474249246974342
- Speed Index: 1.96s
- JS transfer: 162,047 bytes
- Report URL: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1781684750642-96142.report.html

## Manual chunking notes

- Splitting React, Redux, router, and chart packages produced a Rollup circular chunk warning on the first attempt.
- Combining React and Redux removed the warning, but the default route picked up more transfer and Lighthouse regressed.
- Splitting only chart packages still pulled the sentiment chart chunk into the default route preload path.
- The final config keeps route chunking from the previous change and adds build tooling around it.

## Next things to check

- Fix the font loading path next; it is still the clearest LCP and CLS target.
- Revisit route fallback layout after the font fix if CLS stays near 0.09.
