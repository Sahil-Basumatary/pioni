import { useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChartDownIcon,
  LineChartUpIcon,
  PercentageIcon,
  RocketIcon,
  StarIcon,
} from "../../components/shell/shellIcons";
import { useAppDispatch } from "../../app/hooks";
import { symbolSelected } from "../instrument/instrumentSlice";
import { useMarketSearch } from "../markets/MarketSearchContext";
import MarketsTable from "../markets/MarketsTable";
import {
  filterMarketRows,
  sortMarketRows,
  useMarketRows,
  type MarketSort,
} from "../markets/useMarketRows";

type IconProps = { className?: string };

const TABS: {
  id: "Favorites" | "Top Traded" | "Gainers" | "Losers" | "New";
  Icon: ComponentType<IconProps>;
}[] = [
  { id: "Favorites", Icon: StarIcon },
  { id: "Top Traded", Icon: PercentageIcon },
  { id: "Gainers", Icon: LineChartUpIcon },
  { id: "Losers", Icon: LineChartDownIcon },
  { id: "New", Icon: RocketIcon },
];

type Tab = (typeof TABS)[number]["id"];

export default function HomeMarketsStrip() {
  const [tab, setTab] = useState<Tab>("Top Traded");
  const { favorites, toggleFav } = useMarketSearch();
  const { rows } = useMarketRows();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const sort: MarketSort =
    tab === "Gainers" ? "gainers" : tab === "Losers" ? "losers" : "volume";

  const visible = useMemo(() => {
    if (tab === "New") return [];
    const filtered = filterMarketRows(rows, "", tab === "Favorites", favorites);
    return sortMarketRows(filtered, sort).slice(0, 6);
  }, [rows, tab, favorites, sort]);

  function selectMarket(symbol: string) {
    const row = visible.find((r) => r.symbol === symbol);
    dispatch(symbolSelected(row?.tradeSymbol ?? symbol));
    navigate("/trading");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex flex-grow justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {TABS.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rail-icon inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                tab === id
                  ? "bg-black/[0.08] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {id}
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
            onSelect={selectMarket}
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
