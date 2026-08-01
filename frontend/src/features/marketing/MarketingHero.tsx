import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import MarketingHeroMedia from "./MarketingHeroMedia";

export default function MarketingHero() {
  return (
    <div
      data-mkt="hero"
      className="mx-auto grid w-full max-w-5xl gap-10 px-4 pt-10 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-12"
    >
      <div>
        <p
          data-mkt="eyebrow"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Paper trading
        </p>
        <h1
          data-mkt="title"
          className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl"
        >
          Pioni
        </h1>
        <p
          data-mkt="lede"
          className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]"
        >
          The command center for practice trading. Live market data, a full desk
          layout, and simulated funds so you can learn the workflow before anything
          is real money.
        </p>
        <div data-mkt="ctas" className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--text-primary)] px-5 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </Link>
          <Link
            to="/trading"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.03]"
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
      <MarketingHeroMedia />
    </div>
  );
}
