# Pioni frontend

React + TypeScript single-page app for the Pioni paper-trading platform, built with Vite.

## Running locally

```bash
npm ci
cp .env.example .env   # then fill in VITE_CLERK_PUBLISHABLE_KEY
npm run dev            # http://localhost:5173
```

The app expects the gateway on `VITE_GATEWAY_URL` (default `http://localhost:8000`). See the
repository root `README.md` and `Makefile` for bringing up the backend services.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run lint` | ESLint over the whole workspace |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once |
| `npm run coverage` | Vitest with V8 coverage thresholds |
| `npm run cy:run` | Cypress against a running dev server |
| `npm run e2e` | Boots the dev server and runs the stubbed Cypress suite |
| `npm run e2e:smoke` | Cypress smoke checks against a live backend stack |
| `npm run perf:size` | Build, then report bundle sizes |
| `npm run perf:budget` | Build, then fail if the bundle budget is exceeded |

CI runs lint, typecheck, coverage, the stubbed Cypress suite, the production build, and the
bundle budget check.

## Layout

```
src/
  app/          Redux store, typed hooks, RTK Query base query
  components/   Shared UI and the application shell (top bar, nav, rails)
  features/     Vertical slices — trading, orders, portfolio, markets, settings, onboarding
  pages/        Route-level components
  hooks/        Cross-cutting hooks
  utils/        Formatting helpers
```

Anything backed by an authenticated endpoint renders `features/auth/SignedOutUnlock` when the
visitor is signed out, rather than sample data. Home and History use the full-page unlock splash.

## Performance

`docs/perf-lab/` records the measurements behind each performance change, and
`docs/performance.md` summarises the current budgets.
