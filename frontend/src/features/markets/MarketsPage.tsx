import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { symbolSelected } from "../instrument/instrumentSlice";
import {
  StarIcon,
  FireIcon,
  RocketIcon,
  LineChartUpIcon,
  LineChartDownIcon,
} from "../../components/shell/shellIcons";
import { useMarketSearch } from "./MarketSearchContext";
import CategoryIndicesCard from "./CategoryIndicesCard";
import MarketsTable from "./MarketsTable";
import {
  filterMarketRows,
  sortMarketRows,
  useMarketRows,
  type MarketSort,
} from "./useMarketRows";
import { formatVolume } from "./format";

type MainTab = "favorites" | "crypto" | "futures" | "forex";
type ProductTab = "spot" | "margin" | "futures" | "otc";
type Chip = "hot" | "new" | "gainers" | "losers" | null;

export default function MarketsPage() {
  const { favorites, toggleFav } = useMarketSearch();
  const { rows, isLoading } = useMarketRows();
  const [mainTab, setMainTab] = useState<MainTab>("crypto");
  const [product, setProduct] = useState<ProductTab>("spot");
  const [chip, setChip] = useState<Chip>(null);
  const [query, setQuery] = useState("");
  const [showCategoryCharts, setShowCategoryCharts] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const sort: MarketSort =
    chip === "gainers" ? "gainers" : chip === "losers" ? "losers" : "volume";

  const visible = useMemo(() => {
    const filtered = filterMarketRows(
      rows,
      query,
      mainTab === "favorites",
      favorites,
    );
    return sortMarketRows(filtered, sort);
  }, [rows, query, mainTab, favorites, sort]);

  const totalVol = rows.reduce((sum, r) => sum + (r.volume ?? 0), 0);
  const showIndices =
    showCategoryCharts && mainTab === "crypto" && product === "spot";

  function select(symbol: string) {
    dispatch(symbolSelected(symbol));
    navigate("/trading");
  }

  const spotTable =
    mainTab === "futures" ||
    mainTab === "forex" ||
    product !== "spot" ? (
      <p className="px-3 py-12 text-center text-sm text-[var(--text-muted)]">
        {product !== "spot"
          ? product === "otc"
            ? "OTC markets live on the OTC desk."
            : `Simulated ${product} markets come after Spot parity.`
          : `${mainTab === "forex" ? "Forex" : "Futures"} markets are planned next.`}
      </p>
    ) : isLoading && !rows.some((r) => r.price != null) ? (
      <p className="px-3 py-12 text-center text-sm text-[var(--text-muted)]">
        Loading markets…
      </p>
    ) : (
      <MarketsTable
        rows={visible}
        variant="full"
        favorites={favorites}
        onToggleFavorite={toggleFav}
        onSelect={select}
        emptyMessage={
          mainTab === "favorites"
            ? "Star markets to pin them here."
            : "No markets match."
        }
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-[1750px] flex-col gap-2">
      <section className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] px-3 py-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MainTabBtn
              active={mainTab === "favorites"}
              onClick={() => setMainTab("favorites")}
              icon={<StarIcon className="h-3.5 w-3.5" />}
              label="Favorites"
            />
            <MainTabBtn
              active={mainTab === "crypto"}
              onClick={() => setMainTab("crypto")}
              label="Crypto"
            />
            <MainTabBtn
              active={mainTab === "futures"}
              onClick={() => setMainTab("futures")}
              label="Futures"
            />
            <MainTabBtn
              active={mainTab === "forex"}
              onClick={() => setMainTab("forex")}
              label="Forex"
            />
          </div>
          <label className="hidden shrink-0 cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)] sm:inline-flex">
            <input
              type="checkbox"
              role="switch"
              aria-label="Categories charts"
              checked={showCategoryCharts}
              onChange={(e) => setShowCategoryCharts(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-4 w-7 rounded-full bg-black/[0.12] after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-3" />
            <span className="whitespace-nowrap">Categories charts</span>
          </label>
          <span className="shrink-0 rounded-full bg-black/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
            {formatVolume(totalVol)} USD
          </span>
        </div>
        <div className="flex items-center px-3 py-2 sm:hidden">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              role="switch"
              aria-label="Categories charts"
              checked={showCategoryCharts}
              onChange={(e) => setShowCategoryCharts(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-4 w-7 rounded-full bg-black/[0.12] after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-3" />
            Categories charts
          </label>
        </div>
        <div className="px-3 py-2">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-black/[0.06] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ProductChip
              active={product === "spot"}
              onClick={() => setProduct("spot")}
              label="Spot"
            />
            <ProductChip
              active={product === "margin"}
              onClick={() => setProduct("margin")}
              label="Margin"
            />
            <ProductChip
              active={product === "futures"}
              onClick={() => setProduct("futures")}
              label="Futures"
            />
            <ProductChip
              active={product === "otc"}
              onClick={() => setProduct("otc")}
              label="OTC"
            />
          </div>
        </div>
        {showIndices ? <CategoryIndicesCard rows={rows} /> : null}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 pt-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 focus-within:border-[var(--accent)] sm:min-w-[12rem] sm:max-w-sm">
            <SearchGlyph />
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip
              label="Hot"
              icon={<FireIcon className="h-3.5 w-3.5" />}
              active={chip === "hot"}
              onClick={() => setChip(chip === "hot" ? null : "hot")}
            />
            <FilterChip
              label="New"
              icon={<RocketIcon className="h-3.5 w-3.5" />}
              active={chip === "new"}
              onClick={() => setChip(chip === "new" ? null : "new")}
            />
            <FilterChip
              label="Gainers"
              icon={<LineChartUpIcon className="h-3.5 w-3.5" />}
              active={chip === "gainers"}
              onClick={() => setChip(chip === "gainers" ? null : "gainers")}
            />
            <FilterChip
              label="Losers"
              icon={<LineChartDownIcon className="h-3.5 w-3.5" />}
              active={chip === "losers"}
              onClick={() => setChip(chip === "losers" ? null : "losers")}
            />
          </div>
        </div>
        <div className="px-2 pb-3">{spotTable}</div>
      </section>
    </div>
  );
}

function MainTabBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rail-icon inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
        active
          ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--card-border)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProductChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rail-icon shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm"
          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rail-icon inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-black/[0.04] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SearchGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
    >
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m10.5 10.5 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
