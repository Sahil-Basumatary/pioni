import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingTrust() {
  return (
    <section
      data-mkt="trust"
      className="mx-auto mt-20 w-full max-w-5xl px-4 sm:mt-24"
      aria-labelledby="mkt-trust-title"
    >
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-10 shadow-[var(--shadow-card)] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Paper only
        </p>
        <h2
          id="mkt-trust-title"
          className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl"
        >
          Simulated funds. Clear limits. No real money at risk.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
          Pioni is for learning the workflow of a trading desk. Balances, fills, and
          fees are simulated. This is not a brokerage, not investment advice, and not
          a path to withdraw real cash.
        </p>
        <Link
          to={SIGN_UP_PATH}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--text-primary)] px-5 text-sm font-medium text-white hover:opacity-90"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
