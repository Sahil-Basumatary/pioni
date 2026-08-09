import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingHero() {
  return (
    <section
      id="overview"
      data-mkt="hero"
      className="mx-auto w-full max-w-[1320px] scroll-mt-32 px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6"
    >
      <div data-mkt="hero-copy" className="max-w-3xl">
        <p
          data-mkt="eyebrow"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Paper trading
        </p>
        <h1
          data-mkt="title"
          className="mt-2 text-[32px] type-display font-medium leading-9 text-[var(--text-primary)] sm:text-[40px] sm:leading-[44px]"
        >
          Learn to trade without risking real money
        </h1>
        <p
          data-mkt="lede"
          className="mt-2.5 max-w-[36rem] text-[15px] leading-relaxed text-[var(--text-muted)]"
        >
          Place orders against live market data and see what your decisions would
          have cost, before any money is on the line.
        </p>
        <div
          data-mkt="ctas"
          className="mt-4 flex flex-wrap items-center gap-2.5"
        >
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-10 min-w-[132px] items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-4 text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
          >
            Start paper trading
          </Link>
          <Link
            to="/trading"
            className="inline-flex h-10 min-w-[132px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--mkt-hover)]"
          >
            View the desk
          </Link>
        </div>
      </div>
    </section>
  );
}
