import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { assetIconUrl } from "./activityFormat";
import { StarFilledIcon } from "./shellIcons";
import { symbolSelected } from "../../features/instrument/instrumentSlice";
import { useMarketSearch } from "../../features/markets/MarketSearchContext";
import {
  formatChangePct,
  formatMarketPrice,
} from "../../features/markets/format";
import {
  filterMarketRows,
  useMarketRows,
  type MarketRow,
} from "../../features/markets/useMarketRows";

type FavoritesRailPanelProps = {
  onClose: () => void;
};

export default function FavoritesRailPanel({ onClose }: FavoritesRailPanelProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { favorites, toggleFav, openSearch } = useMarketSearch();
  const { rows, isLoading } = useMarketRows();
  const visible = useMemo(
    () => filterMarketRows(rows, "", true, favorites),
    [rows, favorites],
  );

  function select(row: MarketRow) {
    dispatch(symbolSelected(row.tradeSymbol ?? row.symbol));
    navigate("/trading");
    onClose();
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Star markets from Trade to pin them here.
        </p>
        <button
          type="button"
          onClick={() => {
            openSearch();
            onClose();
          }}
          className="inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
        >
          Search markets
        </button>
      </div>
    );
  }

  if (isLoading && visible.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        Loading favorites…
      </p>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        Star markets from Trade to pin them here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {visible.map((row) => (
        <FavoriteRow
          key={row.symbol}
          row={row}
          onSelect={() => select(row)}
          onToggleFavorite={() => toggleFav(row.tradeSymbol ?? row.symbol)}
        />
      ))}
    </ul>
  );
}

function FavoriteRow({
  row,
  onSelect,
  onToggleFavorite,
}: {
  row: MarketRow;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const quote = row.quote ?? "USD";
  const changeClass =
    row.changePct == null
      ? "text-[var(--text-muted)]"
      : row.changePct >= 0
        ? "text-emerald-600"
        : "text-rose-500";
  const iconSrc = assetIconUrl(row.tradeSymbol ?? row.symbol);

  return (
    <li className="flex items-stretch gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
      <button
        type="button"
        onClick={onSelect}
        className="rail-icon flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02]"
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full"
            loading="lazy"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.08] text-[10px] font-semibold text-[var(--text-primary)]">
            {row.label.slice(0, 3)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span>
              {row.label}
              <span className="text-[var(--text-muted)]">/{quote}</span>
            </span>
            {row.marginLeverage != null ? (
              <span className="rounded bg-black/[0.08] px-1 py-0.5 text-[10px] font-semibold tabular-nums">
                {row.marginLeverage}x
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-[var(--text-muted)]">{row.name}</p>
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {formatMarketPrice(row.price)}
          </p>
          <p className={`text-xs ${changeClass}`}>
            {formatChangePct(row.changePct)}
          </p>
        </div>
      </button>
      <button
        type="button"
        aria-label={`Remove ${row.label} from favorites`}
        onClick={onToggleFavorite}
        className="rail-icon flex w-10 shrink-0 items-center justify-center text-amber-500 hover:bg-black/[0.04]"
      >
        <StarFilledIcon className="h-4 w-4" />
      </button>
    </li>
  );
}
