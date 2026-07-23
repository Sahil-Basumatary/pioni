import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveMarketTrade } from "../../features/market/liveMarketStore";
import { getMarketMeta } from "../markets/catalog";
import { useMarketSearch } from "../markets/MarketSearchContext";
import { BellIcon, StarFilledIcon, StarIcon } from "../../components/shell/shellIcons";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";
import { useGetOrderBookQuery } from "../orders/ordersApi";
import type { TickerSnapshot } from "../../types/market";
import type { TradingVenue } from "./tradingVenue";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const SNAPSHOT_REFRESH_MS = 15_000;
const FLASH_DURATION_MS = 500;
const PAPER_MAKER_FEE = "0.00%";
const PAPER_TAKER_FEE = "0.00%";
const FUTURES_PAPER_MAKER_FEE = "0.0200%";
const FUTURES_PAPER_TAKER_FEE = "0.0500%";
const FUTURES_PAPER_FUNDING = "0.0000% / hr";

function nextFundingAtLabel(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(0);
  d.setHours(d.getHours() + 1);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function priceDecimals(price: number): number {
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  if (price >= 0.01) return 5;
  return 8;
}

function formatPrice(raw: string | number): string {
  const num = Number(raw);
  if (!Number.isFinite(num)) return "—";
  const decimals = priceDecimals(num);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatVolume(raw: string | null | undefined): string {
  if (raw == null) return "—";
  const num = Number(raw);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(2);
}

function formatChangePct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatChangeAbs(raw: string | null | undefined): string {
  if (raw == null) return "—";
  const num = Number(raw);
  if (!Number.isFinite(num)) return "—";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${formatPrice(Math.abs(num))}`;
}

async function fetchSnapshot(symbol: string): Promise<TickerSnapshot> {
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const res = await fetch(`${base}/market/prices/${symbol}`);
  if (!res.ok) throw new Error(`ticker fetch ${res.status}`);
  return res.json();
}

function PairHeader({
  symbol,
  venue = "spot",
  onCreateAlert,
  compact = false,
}: {
  symbol: string;
  venue?: TradingVenue;
  onCreateAlert?: () => void;
  compact?: boolean;
}) {
  const trade = useLiveMarketTrade(symbol);
  const { favorites, toggleFav, openSearch } = useMarketSearch();
  const { data: book } = useGetOrderBookQuery({ symbol, depth: 1 }, {
    pollingInterval: 5_000,
  });
  const meta = getMarketMeta(symbol);
  const asset = baseAsset(symbol);
  const favorited = favorites.includes(symbol.toUpperCase());
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(null);
  const [flashDir, setFlashDir] = useState<"up" | "down" | "">("");
  const prevPriceRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    prevPriceRef.current = null;
    setSnapshot(null);
    setFlashDir("");
    setImgFailed(false);
    let cancelled = false;
    fetchSnapshot(symbol)
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetchSnapshot(symbol)
        .then((s) => {
          if (!cancelled) setSnapshot(s);
        })
        .catch(() => {});
    }, SNAPSHOT_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbol]);

  const currentPrice = trade
    ? Number(trade.price)
    : snapshot
      ? Number(snapshot.price)
      : null;

  useEffect(() => {
    if (currentPrice === null) return;
    const prev = prevPriceRef.current;
    if (prev !== null && prev !== currentPrice) {
      setFlashDir(currentPrice > prev ? "up" : "down");
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashDir(""), FLASH_DURATION_MS);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  const changePct = snapshot?.change_pct_24h ?? null;
  const changeAbs = snapshot?.change_24h ?? null;
  const bid = book?.best_bid != null ? Number(book.best_bid) : null;
  const ask = book?.best_ask != null ? Number(book.best_ask) : null;
  const indexPrice =
    bid != null && ask != null && Number.isFinite(bid) && Number.isFinite(ask)
      ? (bid + ask) / 2
      : currentPrice;

  const lastLabel = venue === "futures" ? "Mark price" : "Last price";
  const markOrLast =
    venue === "futures" ? (currentPrice ?? indexPrice) : currentPrice;
  const lastValue =
    markOrLast != null ? `${formatPrice(markOrLast)} USD` : "—";
  const priceFlashClass =
    flashDir === "up"
      ? "text-emerald-500"
      : flashDir === "down"
        ? "text-red-500"
        : "text-[var(--text-primary)]";

  const pairButton = (
    <button
      type="button"
      aria-label="Select market"
      onClick={openSearch}
      className="rail-icon flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-black/[0.04]"
    >
      <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
        {!imgFailed ? (
          <img
            src={assetIconUrl(symbol)}
            alt=""
            className="absolute inset-0 size-full object-scale-down"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
            {asset.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="min-w-0 text-left">
        <span className="flex items-center gap-1 text-xs font-semibold leading-none text-[var(--text-primary)]">
          <span>
            <span>{asset}</span>
            {venue === "futures" ? (
              <span className="text-[var(--text-muted)]"> Perp</span>
            ) : (
              <span className="text-[var(--text-muted)]">/USD</span>
            )}
          </span>
          {venue === "margin" && (
            <span className="rounded bg-black/[0.08] px-1 py-0.5 text-[10px] font-semibold tabular-nums">
              10x
            </span>
          )}
          {venue === "futures" && (
            <span className="rounded bg-black/[0.08] px-1 py-0.5 text-[10px] font-semibold tabular-nums">
              100x
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-none text-[var(--text-muted)]">
          {meta?.name ?? asset}
        </span>
      </span>
    </button>
  );

  const alertFav = (
    <>
      <button
        type="button"
        aria-label="Create alert"
        title="Create alert"
        onClick={onCreateAlert}
        className="rail-icon flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <BellIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggleFav(symbol)}
        className={`rail-icon flex h-7 w-7 items-center justify-center rounded-full ${
          favorited ? "text-amber-500" : "text-[var(--text-muted)]"
        }`}
      >
        {favorited ? (
          <StarFilledIcon className="h-4 w-4" />
        ) : (
          <StarIcon className="h-4 w-4" />
        )}
      </button>
    </>
  );

  const metrics = (
    <>
      <div
        className={`flex shrink-0 flex-col whitespace-nowrap ${
          compact ? "h-8 justify-between" : "gap-0.5"
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap text-[var(--text-muted)]">
          {lastLabel}
        </span>
        <span
          data-testid="live-price"
          className={`whitespace-nowrap tabular-nums tracking-tight transition-colors duration-300 ${priceFlashClass} ${
            compact
              ? "text-[14px] font-medium"
              : "text-[15px] font-semibold"
          }`}
        >
          {lastValue}
        </span>
      </div>
      <Stat
        compact={compact}
        label="Index price"
        value={indexPrice != null ? formatPrice(indexPrice) : "—"}
        suffix={indexPrice != null ? "USD" : undefined}
      />
      <div
        className={`flex shrink-0 flex-col whitespace-nowrap ${
          compact ? "h-8 justify-between" : "gap-0.5"
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap text-[var(--text-muted)]">
          24H Change
        </span>
        <span
          className={`whitespace-nowrap font-medium tabular-nums ${
            compact ? "text-[14px]" : "text-[13px]"
          } ${
            changePct == null
              ? "text-[var(--text-primary)]"
              : changePct >= 0
                ? "text-emerald-600"
                : "text-rose-500"
          }`}
        >
          {venue === "futures" ? (
            formatChangePct(changePct)
          ) : (
            <>
              {formatChangeAbs(changeAbs)}{" "}
              <span className="text-[var(--text-muted)]">
                ({formatChangePct(changePct)})
              </span>
            </>
          )}
        </span>
      </div>
      {venue === "futures" ? (
        <>
          <Stat compact={compact} label="Funding rate" value={FUTURES_PAPER_FUNDING} />
          <Stat
            compact={compact}
            label="Next funding rate"
            value={`0.0000% @ ${nextFundingAtLabel()}`}
          />
          <Stat
            compact={compact}
            label="24H Volume"
            value={
              snapshot?.volume_24h
                ? `${formatVolume(snapshot.volume_24h)} ${asset}`
                : "—"
            }
          />
          <Stat compact={compact} label="Open interest" value="—" />
        </>
      ) : (
        <>
          <Stat
            compact={compact}
            label="24H Volume"
            value={
              snapshot?.volume_24h
                ? `${formatVolume(snapshot.volume_24h)} ${asset}`
                : "—"
            }
          />
          {!compact && (
            <>
              <Stat
                label="24H High"
                value={snapshot?.high_24h ? formatPrice(snapshot.high_24h) : "—"}
              />
              <Stat
                label="24H Low"
                value={snapshot?.low_24h ? formatPrice(snapshot.low_24h) : "—"}
              />
            </>
          )}
        </>
      )}
      <Link
        to="/terms"
        title="Paper trading — no exchange fees"
        className={`flex shrink-0 flex-col whitespace-nowrap rounded-lg px-1 py-0.5 hover:bg-black/[0.04] ${
          compact ? "h-8 justify-between" : "gap-0.5"
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap text-[var(--text-muted)]">
          Fees
        </span>
        <span
          className={`inline-flex items-center gap-1 font-medium tabular-nums text-[var(--text-primary)] ${
            compact ? "text-[14px]" : "text-[13px]"
          }`}
        >
          {venue === "futures" ? FUTURES_PAPER_MAKER_FEE : PAPER_MAKER_FEE}
          <span className="text-[var(--text-muted)]">/</span>
          {venue === "futures" ? FUTURES_PAPER_TAKER_FEE : PAPER_TAKER_FEE}
          <ChevronRightTiny />
        </span>
      </Link>
    </>
  );

  if (compact) {
    return (
      <div
        data-tour="pair-header"
        className="mx-2 mb-1 flex h-12 flex-row items-center gap-2"
      >
        <div className="flex shrink-0 items-center gap-1">
          {pairButton}
          {alertFav}
        </div>
        <div className="relative flex min-w-0 grow items-center overflow-hidden">
          <div className="mx-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-row items-center gap-5">{metrics}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tour="pair-header"
      className="flex flex-wrap items-center gap-3 border-b border-[var(--card-border)] bg-[var(--card-bg)] px-2 py-1.5"
    >
      <button
        type="button"
        onClick={openSearch}
        className="rail-icon flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-black/[0.04]"
      >
        <span className="relative inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
          {!imgFailed ? (
            <img
              src={assetIconUrl(symbol)}
              alt=""
              className="absolute inset-0 size-full object-scale-down"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
              {asset.slice(0, 1)}
            </span>
          )}
        </span>
        <span className="text-left">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <span>
              {asset}
              {venue === "futures" ? (
                <span className="text-[var(--text-muted)]"> Perp</span>
              ) : (
                <span className="text-[var(--text-muted)]">/USD</span>
              )}
            </span>
            {venue === "margin" && (
              <span className="rounded bg-black/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">
                10x
              </span>
            )}
            {venue === "futures" && (
              <span className="rounded bg-black/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">
                100x
              </span>
            )}
          </span>
          <span className="block text-xs text-[var(--text-muted)]">
            {meta?.name ?? asset}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Create alert"
        title="Create alert"
        onClick={onCreateAlert}
        className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <BellIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggleFav(symbol)}
        className={`rail-icon flex h-8 w-8 items-center justify-center rounded-lg ${
          favorited ? "text-amber-500" : "text-[var(--text-muted)]"
        }`}
      >
        {favorited ? (
          <StarFilledIcon className="h-4 w-4" />
        ) : (
          <StarIcon className="h-4 w-4" />
        )}
      </button>
      <div className="mx-1 h-8 w-px bg-[var(--card-border)]" />
      <div className="flex flex-wrap items-center gap-5">{metrics}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  compact = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 flex-col whitespace-nowrap ${
        compact ? "h-8 justify-between" : "gap-0.5"
      }`}
    >
      <span className="text-[10px] uppercase tracking-wider whitespace-nowrap text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className={`whitespace-nowrap font-medium tabular-nums text-[var(--text-primary)] ${
          compact ? "text-[14px]" : "text-[13px]"
        }`}
      >
        {value}
        {suffix ? (
          <span className="ms-0.5 text-[var(--text-muted)]">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

function ChevronRightTiny() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-[var(--text-muted)]"
    >
      <path
        d="M10.9238 7.57617L14.9238 11.5762L15.3486 12L14.9238 12.4238L10.9238 16.4238L10.5 16.8486L9.65137 16L10.0762 15.5762L13.6523 12L10.0762 8.42383L9.65137 8L10.5 7.15137L10.9238 7.57617Z"
        className="fill-current"
      />
    </svg>
  );
}

export default memo(PairHeader);
