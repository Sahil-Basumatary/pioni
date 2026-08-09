import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { MARKET_CATALOG } from "../markets/catalog";
import { deskPath } from "../markets/marketLinks";

const CATEGORIES = [...new Set(MARKET_CATALOG.map((m) => m.category))];
const TABS = ["All", ...CATEGORIES];

export default function MarketingBrowseIndex() {
  const [tab, setTab] = useState("All");

  const markets = useMemo(
    () =>
      tab === "All"
        ? MARKET_CATALOG
        : MARKET_CATALOG.filter((m) => m.category === tab),
    [tab],
  );

  return (
    <section
      id="browse"
      data-mkt="browse-index"
      className="marketing-browse scroll-mt-32 border-t border-[var(--card-border)] py-10"
      aria-labelledby="mkt-browse-title"
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <h2
          id="mkt-browse-title"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
        >
          Browse markets
        </h2>

        <div
          className="mt-3 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter markets by category"
        >
          {TABS.map((name) => {
            const isActive = tab === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isActive}
                onClick={() => setTab(name)}
                className={`shrink-0 whitespace-nowrap py-1 text-[15px] transition-colors ${
                  isActive
                    ? "font-semibold text-[var(--text-primary)]"
                    : "font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <ul className="marketing-browse__grid mt-3">
          {markets.map((market) => (
            <li key={market.symbol} data-mkt="browse-market">
                    <Link
                      to={deskPath(market.symbol)}
                className="group flex items-center gap-2 py-1.5 text-[14px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <img
                  src={assetIconUrl(market.symbol)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-5 w-5 shrink-0 rounded-full bg-white object-scale-down"
                />
                <span className="truncate group-hover:underline">{market.name}</span>
                <span className="shrink-0 text-[11px] tabular-nums opacity-60">
                  {market.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
