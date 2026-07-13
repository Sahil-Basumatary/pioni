import { useMemo, useState } from "react";
import { useMarketSearch } from "../markets/MarketSearchContext";
import MarketsTable from "../markets/MarketsTable";
import {
  filterMarketRows,
  sortMarketRows,
  useMarketRows,
  type MarketSort,
} from "../markets/useMarketRows";

const TABS = ["Favorites", "Top Traded", "Gainers", "Losers", "New"] as const;
type Tab = (typeof TABS)[number];

export default function HomeMarketsStrip() {
  const [tab, setTab] = useState<Tab>("Top Traded");
  const { favorites, toggleFav } = useMarketSearch();
  const { rows } = useMarketRows();

  const sort: MarketSort =
    tab === "Gainers" ? "gainers" : tab === "Losers" ? "losers" : "volume";

  const visible = useMemo(() => {
    if (tab === "New") return [];
    const filtered = filterMarketRows(rows, "", tab === "Favorites", favorites);
    return sortMarketRows(filtered, sort).slice(0, 6);
  }, [rows, tab, favorites, sort]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex flex-grow justify-between gap-3 px-4 pt-4">
        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rail-icon rounded-lg px-2 py-1.5 text-xs font-medium ${
                tab === t
                  ? "bg-black/[0.08] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 pb-3 pt-2">
        {tab === "New" ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--text-muted)]">
            New listings will show up here.
          </p>
        ) : (
          <MarketsTable
            rows={visible}
            variant="compact"
            favorites={favorites}
            onToggleFavorite={toggleFav}
            emptyMessage={
              tab === "Favorites"
                ? "Star markets from Trade to pin them here."
                : "No markets yet."
            }
          />
        )}
      </div>
    </section>
  );
}
