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
import CategoryHeatmapCard from "./CategoryHeatmapCard";
import MarketsTable from "./MarketsTable";
import {
  asFuturesRows,
  asInverseFuturesRows,
  asMarginRows,
  filterMarketRows,
  sortMarketRows,
  useForexRows,
  useMarketRows,
  type MarketRow,
  type MarketSort,
} from "./useMarketRows";
import { formatVolume } from "./format";

type MainTab = "favorites" | "crypto" | "futures" | "forex";
type CryptoProduct = "spot" | "margin" | "futures";
type FuturesProduct = "futures" | "inverse";
type Chip = "hot" | "fixed" | "new" | "gainers" | "losers" | "categories" | null;

export default function MarketsPage() {
  const { favorites, toggleFav } = useMarketSearch();
  const { rows, isLoading } = useMarketRows();
  const forexRows = useForexRows();
  const [mainTab, setMainTab] = useState<MainTab>("crypto");
  const [cryptoProduct, setCryptoProduct] = useState<CryptoProduct>("spot");
  const [futuresProduct, setFuturesProduct] = useState<FuturesProduct>("futures");
  const [chip, setChip] = useState<Chip>(null);
  const [query, setQuery] = useState("");
  const [showCategoryCharts, setShowCategoryCharts] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const sort: MarketSort =
    chip === "gainers" ? "gainers" : chip === "losers" ? "losers" : "volume";

  const sourceRows: MarketRow[] = useMemo(() => {
    if (mainTab === "forex") return forexRows;
    if (mainTab === "futures") {
      return futuresProduct === "inverse"
        ? asInverseFuturesRows(rows)
        : asFuturesRows(rows);
    }
    if (mainTab === "crypto" && cryptoProduct === "margin") return asMarginRows(rows);
    if (mainTab === "crypto" && cryptoProduct === "futures") return asFuturesRows(rows);
    return rows;
  }, [mainTab, cryptoProduct, futuresProduct, rows, forexRows]);

  const visible = useMemo(() => {
    const filtered = filterMarketRows(
      sourceRows,
      query,
      mainTab === "favorites",
      favorites,
    );
    return sortMarketRows(filtered, sort);
  }, [sourceRows, query, mainTab, favorites, sort]);

  const totalVol = useMemo(
    () => sourceRows.reduce((sum, r) => sum + (r.volume ?? 0), 0),
    [sourceRows],
  );

  const showIndices =
    showCategoryCharts &&
    mainTab === "crypto" &&
    (cryptoProduct === "spot" || cryptoProduct === "margin");

  const showFunding =
    (mainTab === "crypto" && cryptoProduct === "futures") ||
    mainTab === "futures";

  const isFuturesFilters =
    (mainTab === "crypto" && cryptoProduct === "futures") || mainTab === "futures";

  function select(symbol: string) {
    if (mainTab === "forex") return;
    dispatch(symbolSelected(symbol));
    if (mainTab === "crypto" && cryptoProduct === "margin") {
      navigate("/trade/margin");
      return;
    }
    if (
      (mainTab === "crypto" && cryptoProduct === "futures") ||
      mainTab === "futures"
    ) {
      navigate("/trade/futures");
      return;
    }
    navigate("/trading");
  }

  function setMain(next: MainTab) {
    setMainTab(next);
    setChip(null);
    setQuery("");
    if (next === "crypto") setCryptoProduct("spot");
    if (next === "futures") setFuturesProduct("futures");
  }

  const tableBody =
    isLoading && mainTab !== "forex" && !rows.some((r) => r.price != null) ? (
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
        showFunding={showFunding}
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
              onClick={() => setMain("favorites")}
              icon={<StarIcon className="h-3.5 w-3.5" />}
              label="Favorites"
            />
            <MainTabBtn
              active={mainTab === "crypto"}
              onClick={() => setMain("crypto")}
              label="Crypto"
            />
            <MainTabBtn
              active={mainTab === "futures"}
              onClick={() => setMain("futures")}
              label="Futures"
            />
            <MainTabBtn
              active={mainTab === "forex"}
              onClick={() => setMain("forex")}
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
        {mainTab === "crypto" ? (
          <div className="px-3 py-2">
            <div className="flex gap-1 overflow-x-auto rounded-full bg-black/[0.06] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ProductChip
                active={cryptoProduct === "spot"}
                onClick={() => setCryptoProduct("spot")}
                label="Spot"
              />
              <ProductChip
                active={cryptoProduct === "margin"}
                onClick={() => setCryptoProduct("margin")}
                label="Margin"
              />
              <ProductChip
                active={cryptoProduct === "futures"}
                onClick={() => setCryptoProduct("futures")}
                label="Futures"
              />
            </div>
          </div>
        ) : null}
        {mainTab === "futures" ? (
          <div className="px-3 py-2">
            <div className="flex gap-1 overflow-x-auto rounded-full bg-black/[0.06] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ProductChip
                active={futuresProduct === "futures"}
                onClick={() => setFuturesProduct("futures")}
                label="Futures"
              />
              <ProductChip
                active={futuresProduct === "inverse"}
                onClick={() => setFuturesProduct("inverse")}
                label="Inverse Futures"
              />
            </div>
          </div>
        ) : null}
        {showIndices ? (
          <>
            <CategoryIndicesCard rows={rows} />
            <CategoryHeatmapCard rows={rows} />
          </>
        ) : null}
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
            {isFuturesFilters ? (
              <FilterChip
                label="Fixed"
                active={chip === "fixed"}
                onClick={() => setChip(chip === "fixed" ? null : "fixed")}
              />
            ) : (
              <FilterChip
                label="Hot"
                icon={<FireIcon className="h-3.5 w-3.5" />}
                active={chip === "hot"}
                onClick={() => setChip(chip === "hot" ? null : "hot")}
              />
            )}
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
            {isFuturesFilters ? (
              <FilterChip
                label="Categories"
                active={chip === "categories"}
                onClick={() => setChip(chip === "categories" ? null : "categories")}
              />
            ) : null}
          </div>
        </div>
        <div className="px-2 pb-3">{tableBody}</div>
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
