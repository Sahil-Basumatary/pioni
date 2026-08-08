import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import MarketingHeroMedia from "./MarketingHeroMedia";

export default function MarketingHero() {
  return (
    <section
      id="overview"
      data-mkt="hero"
      className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 pb-12 pt-14 sm:px-6 sm:pb-20 sm:pt-[5.5rem]"
    >
      <div data-mkt="hero-copy" className="mx-auto max-w-3xl text-center">
        <p
          data-mkt="eyebrow"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Paper trading
        </p>
        <h1
          data-mkt="title"
          className="mt-4 text-4xl type-display font-medium text-[var(--text-primary)] sm:text-[56px] sm:leading-[60px]"
        >
          Learn to trade without risking real money
        </h1>
        <p
          data-mkt="lede"
          className="mx-auto mt-6 max-w-[34rem] text-lg leading-relaxed text-[var(--text-muted)]"
        >
          Use live prices, charts, an order book, and simulated funds to learn how
          trading works.
        </p>
        <div
          data-mkt="ctas"
          className="mt-9 flex flex-wrap items-center justify-center gap-2.5"
        >
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-6 text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
          >
            Start paper trading
          </Link>
          <Link
            to="/trading"
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--mkt-hover)]"
          >
            View the desk
          </Link>
        </div>
        <p
          data-mkt="disclaimer"
          className="mt-5 text-sm leading-relaxed text-[var(--text-muted)]"
        >
          Paper trading only. No real money.
        </p>
      </div>
      <div className="mt-12 sm:mt-[3.75rem]">
        <MarketingHeroMedia />
      </div>
    </section>
  );
}
