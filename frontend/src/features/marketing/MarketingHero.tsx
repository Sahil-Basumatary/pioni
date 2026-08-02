import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import MarketingHeroMedia from "./MarketingHeroMedia";

export default function MarketingHero() {
  return (
    <section
      id="overview"
      data-mkt="hero"
      className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 pb-10 pt-16 sm:px-6 sm:pb-14 sm:pt-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p
          data-mkt="eyebrow"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Paper trading
        </p>
        <h1
          data-mkt="title"
          className="mt-5 text-4xl font-normal tracking-tight text-[var(--text-primary)] sm:text-[56px] sm:leading-[60px]"
        >
          Trade a full desk with simulated funds
        </h1>
        <p
          data-mkt="lede"
          className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]"
        >
          Live market data, charts, and an order book — with practice balance
          instead of real money.
        </p>
        <div
          data-mkt="ctas"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl bg-[var(--text-primary)] px-6 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </Link>
          <Link
            to="/trading"
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.03]"
          >
            Explore paper trading
          </Link>
        </div>
        <p
          data-mkt="disclaimer"
          className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]"
        >
          Simulated funds only. Not real money and not investment advice.
        </p>
      </div>
      <div className="mt-10 sm:mt-12">
        <MarketingHeroMedia />
      </div>
    </section>
  );
}
