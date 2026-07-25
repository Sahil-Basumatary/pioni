# Initial-Load Budget

Recorded: 2026-07-25

## Problem

The CI budget gate from `009-ci-budget-gate.md` summed **every** emitted asset and failed above
180 KiB gzip. That total counts each lazily-loaded route chunk, so the gate got stricter every
time a route was added — the opposite of what route code-splitting is for. By the time Earn,
Prop, OTC, Analytics, Convert, Markets, History, and Settings had landed, the sum had reached
280.39 KiB gzip and `npm run perf:budget` failed on every commit, even though no single visit
downloads more than a fraction of it.

## Change

`scripts/perf/bundle-size.mjs` now budgets **initial load** instead of the emitted total. It
reads `dist/index.html` and sums only the scripts and stylesheets the document references —
what a browser fetches before the first route chunk. The per-route budgets are unchanged and
still guard individual chunks.

## Budgets

- Initial-load gzip: 135 KiB
- Initial-load brotli: 120 KiB
- Entry chunk gzip: 110 KiB
- Trading route gzip: 65 KiB
- Sentiment route gzip: 12 KiB
- Sentiment chart gzip: 5 KiB

## Measurement

```text
Initial load:
  assets/index-*.js   gzip 105.71 KiB  brotli 91.84 KiB
  assets/index-*.css  gzip  14.36 KiB  brotli 11.96 KiB
                      ----------------------------------
                      gzip 120.07 KiB  brotli 103.80 KiB
```

The limits sit roughly 12% above the measurement so hash churn does not fail CI while a real
regression still does. The full emitted total stays in the report output as information.

## Validation

```bash
npm run perf:budget
```

```text
Performance budget passed.
```
