# CI Budget Gate

Recorded: 2026-06-18

## Change

- Added `npm run perf:budget`.
- Reused the existing production bundle size script with a `--budget` mode.
- Wired the budget check into GitHub Actions after the frontend production build.

> Superseded by `014-initial-load-budget.md`: the total-across-all-assets budget below was
> replaced with an initial-load budget once route code-splitting made the total misleading.

## Budgets

- Total JavaScript/CSS gzip: 180 KiB
- Total JavaScript/CSS brotli: 160 KiB
- Entry chunk gzip: 110 KiB
- Trading route gzip: 65 KiB
- Sentiment route gzip: 12 KiB
- Sentiment chart gzip: 5 KiB

## Why These Budgets

The limits are slightly above the measured production build so normal hash churn does not fail CI, but large regressions still get caught. The sentiment chart budget is intentionally tight because it protects the Chart.js removal from being accidentally reversed.

## Validation

Command:

```bash
npm run perf:budget
```

Result:

```text
Performance budget passed.
```
