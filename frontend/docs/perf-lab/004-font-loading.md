## Font Loading

- Date: 2026-06-17
- Branch / commit: `main` after `7d2f583`
- Goal: to remove the render-blocking Google Fonts path and keep text rendering stable during first load.

## Change

- Removed the Google Fonts `@import` from the main CSS file.
- Kept `Inter` first in the stack for machines that already have it installed.
- Added system font fallbacks for the page and trading chart canvas.
- Did not add a replacement remote font request

## Bundle size (`npm run perf:size`)

```
dist/index.html                              0.45 kB │ gzip:   0.29 kB
dist/assets/index-B940iO4J.css.br            4.07 kB
dist/assets/index-B940iO4J.css.gz            4.65 kB
dist/assets/SentimentPage-CCKl8Imk.js.br     5.84 kB
dist/assets/SentimentPage-CCKl8Imk.js.gz     6.64 kB
dist/assets/SentimentChart-C-yV7ROP.js.br   41.12 kB
dist/assets/SentimentChart-C-yV7ROP.js.gz   46.62 kB
dist/assets/TradingPage-CphfgqYg.js.br      49.51 kB
dist/assets/TradingPage-CphfgqYg.js.gz      56.94 kB
dist/assets/index-BVxZYPoB.js.br            88.96 kB
dist/assets/index-BVxZYPoB.js.gz           101.85 kB
dist/assets/SentimentPage-BbUDa7HB.css       0.51 kB │ gzip:   0.31 kB
dist/assets/index-B940iO4J.css              18.75 kB │ gzip:   4.66 kB
dist/assets/SentimentPage-CCKl8Imk.js       24.73 kB │ gzip:   6.67 kB
dist/assets/SentimentChart-C-yV7ROP.js     131.09 kB │ gzip:  46.69 kB
dist/assets/TradingPage-CphfgqYg.js        176.71 kB │ gzip:  57.08 kB
dist/assets/index-BVxZYPoB.js              311.65 kB │ gzip: 101.99 kB

assets/SentimentChart-C-yV7ROP.js  raw 128.01 KiB  gzip 45.52 KiB  brotli 40.16 KiB
assets/SentimentPage-BbUDa7HB.css  raw 0.50 KiB    gzip 0.30 KiB   brotli 0.23 KiB
assets/SentimentPage-CCKl8Imk.js   raw 24.15 KiB   gzip 6.49 KiB   brotli 5.70 KiB
assets/TradingPage-CphfgqYg.js     raw 172.57 KiB  gzip 55.61 KiB  brotli 48.35 KiB
assets/index-B940iO4J.css          raw 18.31 KiB   gzip 4.54 KiB   brotli 3.98 KiB
assets/index-BVxZYPoB.js           raw 304.34 KiB  gzip 99.46 KiB  brotli 86.88 KiB

Totals:
  raw:    647.89 KiB
  gzip:   211.92 KiB
  brotli: 185.30 KiB
```

## Lighthouse (`npm run perf:lh`)

- Performance: 97 (runs: 97, 96, 97)
- FCP: 1.51s
- LCP: 1.97s
- TBT: 0ms
- CLS: 0.09467643152457195
- Speed Index: 1.51s
- JS transfer: 162,064 bytes
- Font requests: 0
- Report URL: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1781685062787-56107.report.html

## Interpretation

- Removing the remote font path cut one external CSS/font dependency from first load.
- LCP moved from 2.28s to 1.97s, crossing the 2.0s target.
- FCP moved from 1.96s to 1.51s.
- CLS stayed around 0.095, so the remaining layout movement is more likely route/chart fallback behavior than font swap.

## Next things to check

- Tighten the lazy route fallback so the trading chart card does not shift during initial load.
- Check live interaction latency once the trading feed benchmark exists.
