import { useState } from "react";
import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { StarIcon } from "../../components/shell/shellIcons";
import type { MarketRow } from "./useMarketRows";
import {
  formatChangePct,
  formatFundingRate,
  formatMarketPrice,
  formatVolume,
  sparklinePath,
  sparklinePoints,
} from "./format";

export type MarketsTableVariant = "full" | "compact" | "palette";

type MarketsTableProps = {
  rows: MarketRow[];
  variant?: MarketsTableVariant;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
  emptyMessage?: string;
  showFunding?: boolean;
};

export default function MarketsTable({
  rows,
  variant = "full",
  favorites,
  onToggleFavorite,
  onSelect,
  emptyMessage = "No markets match.",
  showFunding = false,
}: MarketsTableProps) {
  if (!rows.length) {
    return (
      <p className="px-3 py-10 text-center text-sm text-[var(--text-muted)]">{emptyMessage}</p>
    );
  }

  const showCategory = variant === "full";
  const showRange = variant === "full" || variant === "compact";
  const showTrend = variant === "full" || variant === "compact";
  const showVolume = true;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-0 border-collapse text-left sm:min-w-[640px]">
        <thead>
          <tr className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            <th className="px-2 py-2">Market</th>
            {showCategory ? (
              <th className="hidden px-2 py-2 sm:table-cell">Category</th>
            ) : null}
            <th className="px-2 py-2 text-right">Price</th>
            {showRange ? (
              <>
                <th className="hidden px-2 py-2 text-right md:table-cell">24H Low</th>
                <th className="hidden px-2 py-2 text-right md:table-cell">24H High</th>
              </>
            ) : null}
            <th className="px-2 py-2 text-right">24H Chg.</th>
            {showTrend ? (
              <th className="hidden px-2 py-2 text-right lg:table-cell">24H Trend</th>
            ) : null}
            {showFunding ? (
              <th className="hidden px-2 py-2 text-right lg:table-cell">Funding / Basis</th>
            ) : null}
            {showVolume ? (
              <th className="hidden px-2 py-2 text-right sm:table-cell">24H Volume</th>
            ) : null}
            <th className="w-10 px-2 py-2" aria-label="Favorite" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <MarketTableRow
              key={row.symbol}
              row={row}
              showCategory={showCategory}
              showRange={showRange}
              showTrend={showTrend}
              showVolume={showVolume}
              showFunding={showFunding}
              favorited={favorites.includes(row.tradeSymbol ?? row.symbol)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarketTableRow({
  row,
  showCategory,
  showRange,
  showTrend,
  showVolume,
  showFunding,
  favorited,
  onToggleFavorite,
  onSelect,
}: {
  row: MarketRow;
  showCategory: boolean;
  showRange: boolean;
  showTrend: boolean;
  showVolume: boolean;
  showFunding: boolean;
  favorited: boolean;
  onToggleFavorite: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
}) {
  const changeClass =
    row.changePct == null
      ? "text-[var(--text-muted)]"
      : row.changePct >= 0
        ? "text-emerald-600"
        : "text-rose-500";
  const quote = row.quote ?? "USD";

  const marketCell = (
    <div className="flex items-center gap-3">
      <AssetImg
        symbol={row.tradeSymbol ?? row.symbol}
        label={row.label}
        settleOverlay={row.settleOverlay}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
          <span>
            {row.titleSuffix ? (
              <>
                {row.label}{" "}
                <span className="font-normal text-[var(--text-muted)]">{row.titleSuffix}</span>
              </>
            ) : (
              <>
                {row.label}
                <span className="text-[var(--text-muted)]">/{quote}</span>
              </>
            )}
          </span>
          {row.leverage != null ? (
            <span className="rounded bg-black/[0.08] px-1 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">
              {row.leverage}x
            </span>
          ) : null}
        </div>
        <div className="truncate text-xs text-[var(--text-muted)]">{row.name}</div>
      </div>
    </div>
  );

  return (
    <tr className="border-t border-[var(--card-border)] hover:bg-black/[0.02]">
      <td className="px-2 py-2.5">
        {onSelect ? (
          <button
            type="button"
            className="rail-icon w-full text-left"
            onClick={() => onSelect(row.symbol)}
          >
            {marketCell}
          </button>
        ) : (
          <Link to="/trading" className="block hover:opacity-90">
            {marketCell}
          </Link>
        )}
      </td>
      {showCategory ? (
        <td className="hidden px-2 py-2.5 text-xs text-[var(--text-muted)] sm:table-cell">
          {row.category}
        </td>
      ) : null}
      <td className="px-2 py-2.5 text-right text-sm font-medium tabular-nums text-[var(--text-primary)]">
        {formatMarketPrice(row.price)}
        <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">{quote}</span>
      </td>
      {showRange ? (
        <>
          <td className="hidden px-2 py-2.5 text-right text-sm tabular-nums text-[var(--text-muted)] md:table-cell">
            {formatMarketPrice(row.low)}
          </td>
          <td className="hidden px-2 py-2.5 text-right text-sm tabular-nums text-[var(--text-muted)] md:table-cell">
            {formatMarketPrice(row.high)}
          </td>
        </>
      ) : null}
      <td className={`px-2 py-2.5 text-right text-xs font-medium tabular-nums ${changeClass}`}>
        {formatChangePct(row.changePct)}
      </td>
      {showTrend ? (
        <td className="hidden px-2 py-2.5 text-right lg:table-cell">
          <TrendSparkline symbol={row.symbol} changePct={row.changePct} />
        </td>
      ) : null}
      {showFunding ? (
        <td className="hidden px-2 py-2.5 text-right text-xs tabular-nums text-[var(--text-muted)] lg:table-cell">
          {formatFundingRate(row.fundingRate ?? null)}
        </td>
      ) : null}
      {showVolume ? (
        <td className="hidden px-2 py-2.5 text-right text-sm tabular-nums text-[var(--text-primary)] sm:table-cell">
          {formatVolume(row.volume)}
          <span className="ml-1 text-xs text-[var(--text-muted)]">USD</span>
        </td>
      ) : null}
      <td className="px-2 py-2.5 text-right">
        <button
          type="button"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          className={`rail-icon inline-flex h-8 w-8 items-center justify-center rounded-lg ${
            favorited ? "text-amber-500" : "text-[var(--text-muted)]"
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(row.tradeSymbol ?? row.symbol);
          }}
        >
          <StarIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function TrendSparkline({
  symbol,
  changePct,
}: {
  symbol: string;
  changePct: number | null;
}) {
  const points = sparklinePoints(changePct, symbol);
  const d = sparklinePath(points, 72, 28);
  const stroke =
    changePct == null ? "#6A6A6A" : changePct >= 0 ? "#059669" : "#e11d48";
  return (
    <svg width={72} height={28} viewBox="0 0 72 28" aria-hidden="true" className="ml-auto">
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

function AssetImg({
  symbol,
  label,
  settleOverlay,
}: {
  symbol: string;
  label: string;
  settleOverlay?: "usd" | "base";
}) {
  const [failed, setFailed] = useState(false);
  const icon = failed ? (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[10px] font-semibold text-[var(--text-muted)]">
      {label.slice(0, 1)}
    </span>
  ) : (
    <img
      src={assetIconUrl(symbol)}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 shrink-0 rounded-full object-scale-down"
      onError={() => setFailed(true)}
    />
  );
  if (!settleOverlay) return icon;
  return (
    <span
      className="relative inline-flex h-6 w-6 shrink-0 overflow-visible"
      aria-label={settleOverlay === "usd" ? "USD settled" : `${label} settled`}
    >
      {icon}
      {settleOverlay === "usd" ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -end-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--card-bg)] text-[9px] font-bold leading-none text-[var(--text-muted)] ring-1 ring-[rgba(104,107,130,0.24)]"
        >
          $
        </span>
      ) : (
        <img
          src={assetIconUrl(symbol)}
          alt=""
          aria-label={`${label} settle`}
          className="absolute -bottom-1 -end-1 h-3 w-3 rounded-full object-scale-down ring-1 ring-[var(--card-bg)]"
        />
      )}
    </span>
  );
}
