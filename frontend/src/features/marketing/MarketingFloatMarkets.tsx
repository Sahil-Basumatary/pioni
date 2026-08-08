import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { useGetPricesQuery } from "../market/marketApi";
import { MARKET_CATALOG } from "../markets/catalog";
import { formatChangePct, formatMarketPrice } from "../markets/format";
import { SIGN_UP_PATH } from "../auth/authRoutes";

type VenueTab = "spot" | "margin";

const FLOAT_COUNT = 18;

export default function MarketingFloatMarkets() {
  const [tab, setTab] = useState<VenueTab>("spot");
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });

  const cards = useMemo(() => {
    const pool = MARKET_CATALOG.filter((m) =>
      tab === "margin" ? (m.marginLeverage ?? 0) > 0 : true,
    );
    return pool.slice(0, FLOAT_COUNT).map((meta) => {
      const tick = prices?.[meta.symbol];
      const price = tick?.price != null ? Number(tick.price) : null;
      const changePct =
        tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null;
      return { ...meta, price, changePct };
    });
  }, [prices, tab]);

  return (
    <section
      id="markets"
      data-mkt="float-markets"
      className="marketing-float scroll-mt-32 border-y border-[var(--card-border)] pb-24 pt-20 sm:pb-28 sm:pt-24"
      aria-labelledby="mkt-float-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="mkt-float-title"
            className="text-3xl type-display font-medium text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
          >
            {tab === "spot"
              ? "Trade live markets with paper funds"
              : "Learn the margin order flow"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            {tab === "spot"
              ? "Choose a pair, open the desk, and place a simulated order at the current price."
              : "See how margin orders are set up. Every fill still uses your paper balance."}
          </p>
        </div>

        <div className="mt-7 flex justify-center">
          <div
            className="inline-flex rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] p-1"
            role="tablist"
            aria-label="Market type"
          >
            {(
              [
                { id: "spot", label: "Spot" },
                { id: "margin", label: "Margin" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === item.id
                    ? "bg-[var(--mkt-cta-bg)] text-[var(--mkt-cta-fg)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="marketing-float__grid mt-9">
          {cards.map((card) => {
            const up = card.changePct != null && card.changePct >= 0;
            const tone =
              card.changePct == null
                ? "text-[var(--text-muted)]"
                : up
                  ? "text-emerald-600"
                  : "text-rose-500";
            return (
              <Link
                key={card.symbol}
                to="/trading"
                data-mkt="float-card"
                className="marketing-float__card flex h-16 items-center gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--mkt-elevation)]"
              >
                <img
                  src={assetIconUrl(card.symbol)}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full bg-white object-scale-down"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {card.name}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
                    <span className="truncate text-xs tabular-nums text-[var(--text-primary)]">
                      {formatMarketPrice(card.price)}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-medium tabular-nums ${tone}`}
                    >
                      {formatChangePct(card.changePct)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-6 text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
          >
            Start paper trading
          </Link>
        </div>
      </div>
    </section>
  );
}
