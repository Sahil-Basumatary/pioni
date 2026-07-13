import { useEffect, useMemo, useRef, useState } from "react";
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
import MarketsTable from "./MarketsTable";
import {
  filterMarketRows,
  sortMarketRows,
  useMarketRows,
  type MarketSort,
} from "./useMarketRows";

type PaletteTab = "favorites" | "spot" | "futures";
type Chip = "hot" | "new" | "gainers" | "losers" | null;

export default function MarketSearchPalette() {
  const { open, closeSearch, favorites, toggleFav } = useMarketSearch();
  const { rows } = useMarketRows();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<PaletteTab>("spot");
  const [chip, setChip] = useState<Chip>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const sort: MarketSort =
    chip === "gainers" ? "gainers" : chip === "losers" ? "losers" : "volume";

  const visible = useMemo(() => {
    const filtered = filterMarketRows(
      rows,
      query,
      tab === "favorites",
      favorites,
    );
    return sortMarketRows(filtered, sort);
  }, [rows, query, tab, favorites, sort]);

  if (!open) return null;

  function select(symbol: string) {
    dispatch(symbolSelected(symbol));
    closeSearch();
    navigate("/trading");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[min(12vh,6rem)]">
      <button
        type="button"
        aria-label="Dismiss search"
        className="rail-icon absolute inset-0 bg-black/30"
        onClick={closeSearch}
      />
      <div
        role="dialog"
        aria-label="Search for a market"
        className="relative z-[81] flex max-h-[min(70vh,560px)] w-full max-w-[705px] flex-col gap-2 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 pt-4 shadow-[0px_8px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex flex-wrap gap-1">
          <TabChip
            active={tab === "favorites"}
            onClick={() => setTab("favorites")}
            icon={<StarIcon className="h-3.5 w-3.5" />}
            label="Favorites"
          />
          <TabChip
            active={tab === "spot"}
            onClick={() => setTab("spot")}
            label="Spot & Margin"
          />
          <TabChip
            active={tab === "futures"}
            onClick={() => setTab("futures")}
            label="Futures"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 focus-within:border-[var(--accent)]">
          <SearchGlyph />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </label>
        <div className="flex flex-wrap gap-1 pb-1">
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
        <div className="min-h-0 flex-1 overflow-y-auto pb-3">
          {tab === "futures" ? (
            <p className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
              Simulated futures markets come in a later milestone.
            </p>
          ) : (
            <MarketsTable
              rows={visible}
              variant="palette"
              favorites={favorites}
              onToggleFavorite={toggleFav}
              onSelect={select}
              emptyMessage={
                tab === "favorites"
                  ? "Star markets to pin them here."
                  : "No markets match your search."
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabChip({
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
      className={`rail-icon inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
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
