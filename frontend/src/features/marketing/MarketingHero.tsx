import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import { useGetPricesQuery } from "../market/marketApi";
import MarketingFeaturedMarket from "./MarketingFeaturedMarket";
import { featuredRows, toLiveRows } from "./marketingLiveRows";

export default function MarketingHero() {
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });
  const rows = useMemo(() => toLiveRows(prices), [prices]);
  const featured = useMemo(() => featuredRows(rows, 3), [rows]);

  return (
    <section
      id="overview"
      data-mkt="hero"
      className="mx-auto w-full max-w-[1320px] scroll-mt-32 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6"
    >
      <div className="grid gap-7 lg:grid-cols-2 lg:gap-6 xl:gap-10">
        <div
          data-mkt="hero-copy"
          className="flex max-w-[620px] flex-col lg:h-full lg:justify-between"
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
              className="mt-2 text-[32px] type-display font-medium leading-9 text-[var(--text-primary)] sm:text-[40px] sm:leading-[44px] lg:text-[52px] lg:leading-[56px] xl:text-[56px] xl:leading-[60px]"
            >
              Paper trade with live market data
            </h1>
            <p
              data-mkt="lede"
              className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-[var(--text-muted)]"
            >
              Place market and limit orders with simulated USD. No deposit required.
            </p>
          </div>
          <div
            data-mkt="ctas"
            className="mt-4 flex flex-wrap items-center gap-2.5 lg:mt-0"
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
        <div className="min-w-0">
          <MarketingFeaturedMarket rows={featured} />
        </div>
      </div>
    </section>
  );
}
