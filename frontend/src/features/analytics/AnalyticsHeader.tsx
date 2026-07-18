import { memo, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import { getMarketMeta } from "../markets/catalog";
import { useMarketSearch } from "../markets/MarketSearchContext";
import { useConvert } from "../convert/ConvertContext";
import {
  BellIcon,
  ConvertIcon,
  DepositIcon,
  MinusSmallIcon,
  SearchIcon,
  StarFilledIcon,
  StarIcon,
} from "../../components/shell/shellIcons";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";
import { useGetOrderBookQuery } from "../orders/ordersApi";
import type { TickerSnapshot } from "../../types/market";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const SNAPSHOT_REFRESH_MS = 15_000;
const PAPER_MAKER_FEE = "0.00%";
const PAPER_TAKER_FEE = "0.00%";

function priceDecimals(price: number): number {
  if (price >= 100) return 1;
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

function formatCompact(raw: string | number | null | undefined): string {
  if (raw == null) return "—";
  const num = Number(raw);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  if (num >= 100) return num.toFixed(0);
  return num.toFixed(2);
}

function formatChangeAbs(raw: string | null | undefined): string {
  if (raw == null) return "—";
  const num = Number(raw);
  if (!Number.isFinite(num)) return "—";
  return `${formatPrice(Math.abs(num))}USD`;
}

function formatChangePct(pct: number | null): string {
  if (pct == null) return "—";
  return `(${pct.toFixed(2)}%)`;
}

async function fetchSnapshot(symbol: string): Promise<TickerSnapshot> {
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  try {
    const res = await fetch(`${base}/market/prices/${symbol}`);
    if (res.ok) return res.json();
  } catch {
    // fall through
  }
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
  );
  if (!res.ok) throw new Error(`ticker fetch ${res.status}`);
  const t = await res.json();
  const last = Number(t.lastPrice);
  const open = Number(t.openPrice);
  const change = last - open;
  const pct = open > 0 ? (change / open) * 100 : null;
  return {
    symbol,
    exchange: "binance",
    price: String(t.lastPrice ?? ""),
    change_24h: Number.isFinite(change) ? String(change) : null,
    change_pct_24h: pct != null && Number.isFinite(pct) ? pct : null,
    high_24h: t.highPrice ?? null,
    low_24h: t.lowPrice ?? null,
    volume_24h: t.volume ?? null,
    updated_at: Date.now(),
  };
}

function AnalyticsHeader({ symbol }: { symbol: string }) {
  const trade = useLiveMarketTrade(symbol);
  const { favorites, toggleFav, openSearch } = useMarketSearch();
  const { openConvert } = useConvert();
  const { data: book } = useGetOrderBookQuery(
    { symbol, depth: 1 },
    { pollingInterval: 5_000 },
  );
  const meta = getMarketMeta(symbol);
  const asset = baseAsset(symbol);
  const favorited = favorites.includes(symbol.toUpperCase());
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setSnapshot(null);
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
  const bid = book?.best_bid != null ? Number(book.best_bid) : null;
  const ask = book?.best_ask != null ? Number(book.best_ask) : null;
  const indexPrice =
    bid != null && ask != null && Number.isFinite(bid) && Number.isFinite(ask)
      ? (bid + ask) / 2
      : currentPrice;
  const changePct = snapshot?.change_pct_24h ?? null;
  const changeAbs = snapshot?.change_24h ?? null;
  const volumeBase = snapshot?.volume_24h ?? null;
  const quoteVol =
    volumeBase != null && indexPrice != null
      ? Number(volumeBase) * indexPrice
      : null;

  return (
    <div className="my-2 flex h-8 w-full items-center justify-between gap-1 px-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openSearch}
          className="rail-icon flex h-8 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-2.5 hover:bg-black/[0.03]"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="relative inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
            {!imgFailed ? (
              <img
                src={assetIconUrl(symbol)}
                alt=""
                className="absolute inset-0 size-full object-scale-down"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[9px] font-semibold text-[var(--text-muted)]">
                {asset.slice(0, 1)}
              </span>
            )}
          </span>
          <span className="text-left leading-tight">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
              <span>
                {asset}
                <span className="text-[var(--text-muted)]">/USD</span>
              </span>
              <span className="rounded bg-black/[0.08] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">
                10x
              </span>
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">
              {meta?.name ?? asset}
            </span>
          </span>
          <kbd className="ml-2 rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          aria-label="Create alert"
          className="rail-icon flex h-4 w-4 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <BellIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          onClick={() => toggleFav(symbol)}
          className={`rail-icon flex h-4 w-4 items-center justify-center ${
            favorited ? "text-amber-500" : "text-[var(--text-muted)]"
          }`}
        >
          {favorited ? (
            <StarFilledIcon className="h-4 w-4" />
          ) : (
            <StarIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="flex min-w-0 grow items-center overflow-hidden">
        <div className="flex flex-row items-center gap-6">
          <Metric
            label="INDEX PRICE"
            value={
              indexPrice != null ? `${formatPrice(indexPrice)}USD` : "—"
            }
          />
          <Metric
            label="24H CHANGE"
            value={
              <>
                <span
                  className={
                    changePct == null
                      ? "text-[var(--text-primary)]"
                      : changePct >= 0
                        ? "text-[#08844f]"
                        : "text-rose-500"
                  }
                >
                  {formatChangeAbs(changeAbs)}
                </span>{" "}
                <span
                  className={
                    changePct == null
                      ? "text-[var(--text-muted)]"
                      : changePct >= 0
                        ? "text-[#08844f]"
                        : "text-rose-500"
                  }
                >
                  {formatChangePct(changePct)}
                </span>
              </>
            }
          />
          <Metric
            label="24H VOLUME"
            value={
              <>
                <span className="block">
                  {formatCompact(volumeBase)}
                  {asset}
                </span>
                <span className="block text-[var(--text-muted)]">
                  {formatCompact(quoteVol)}USD
                </span>
              </>
            }
          />
          <Link
            to="/terms"
            title="Paper trading — no exchange fees"
            className="flex h-8 flex-col justify-between whitespace-nowrap outline-none hover:opacity-80"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(104,107,130)]">
              FEES
            </span>
            <span className="text-xs font-medium tabular-nums text-[var(--text-primary)]">
              {PAPER_MAKER_FEE}
              <span className="text-[var(--text-muted)]"> / </span>
              {PAPER_TAKER_FEE}
            </span>
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Link
          to="/deposit"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          <DepositIcon className="h-4 w-4" />
          Deposit
        </Link>
        <button
          type="button"
          onClick={() => openConvert()}
          className="rail-icon inline-flex h-8 items-center gap-1.5 rounded-lg bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          <ConvertIcon className="h-4 w-4" />
          Convert
        </button>
        <button
          type="button"
          aria-label="Collapse"
          className="rail-icon inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(104,107,130,0.08)] text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          <MinusSmallIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex h-8 flex-col justify-between whitespace-nowrap">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(104,107,130)]">
        {label}
      </span>
      <span className="text-xs font-medium tabular-nums leading-tight text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

export default memo(AnalyticsHeader);
