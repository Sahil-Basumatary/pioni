# Chart Runtime Cleanup

Recorded: 2026-06-18

## Change

- Removed `chart.js` and `react-chartjs-2` from the frontend dependencies.
- Replaced the sentiment trend chart with a small SVG line chart.
- Kept the trading candlestick chart on `lightweight-charts`, where the richer chart runtime is still justified.

## Bundle size (`npm run perf:size`)

```
assets/SentimentChart-C_4-PYtc.js  raw 1.32 KiB  gzip 0.71 KiB  brotli 0.63 KiB
assets/SentimentPage-D4pDxoU-.js   raw 23.98 KiB gzip 6.41 KiB  brotli 5.64 KiB
assets/TradingPage-ZVqxdGCS.js     raw 172.69 KiB gzip 55.64 KiB brotli 48.39 KiB
assets/index-Cyd-sCi7.js           raw 304.34 KiB gzip 99.46 KiB brotli 86.99 KiB

Totals:
  raw:    521.22 KiB
  gzip:   167.07 KiB
  brotli: 145.88 KiB
```

## Interpretation

The sentiment chart no longer ships the Chart.js runtime. The lazy sentiment chart chunk dropped from about 46.69 KiB gzip to 0.72 KiB gzip, and the default `/trading` route stayed effectively unchanged at about 155.10 KiB gzip for entry plus route code.
