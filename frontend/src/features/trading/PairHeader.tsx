import { memo, useEffect, useRef, useState } from "react";
import { useLiveMarketTrade } from "../../features/market/liveMarketStore";
import { getMarketMeta } from "../markets/catalog";
import { useMarketSearch } from "../markets/MarketSearchContext";
import { StarIcon } from "../../components/shell/shellIcons";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";
import type { TickerSnapshot } from "../../types/market";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const SNAPSHOT_REFRESH_MS = 15_000;
const FLASH_DURATION_MS = 500;

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

async function fetchSnapshot(symbol: string): Promise<TickerSnapshot> {
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const res = await fetch(`${base}/market/prices/${symbol}`);
  if (!res.ok) throw new Error(`ticker fetch ${res.status}`);
  return res.json();
}

function PairHeader({ symbol }: { symbol: string }) {
  const trade = useLiveMarketTrade(symbol);
  const { favorites, toggleFav, openSearch } = useMarketSearch();
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

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 shadow-[var(--shadow-card)]">
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
          <span className="block text-sm font-semibold text-[var(--text-primary)]">
            {asset}
            <span className="text-[var(--text-muted)]">/USD</span>
          </span>
          <span className="block text-xs text-[var(--text-muted)]">
            {meta?.name ?? asset}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggleFav(symbol)}
        className={`rail-icon flex h-8 w-8 items-center justify-center rounded-lg ${
          favorited ? "text-amber-500" : "text-[var(--text-muted)]"
        }`}
      >
        <StarIcon className="h-4 w-4" />
      </button>
      <div className="mx-1 h-8 w-px bg-[var(--card-border)]" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Last price
        </span>
        <div className="flex items-baseline gap-2">
          <span
            data-testid="live-price"
            className={`text-2xl font-semibold tabular-nums tracking-tight transition-colors duration-300 ${
              flashDir === "up"
                ? "text-emerald-500"
                : flashDir === "down"
                  ? "text-red-500"
                  : "text-[var(--text-primary)]"
            }`}
          >
            {currentPrice != null ? `${formatPrice(currentPrice)} USD` : "—"}
          </span>
          {changePct != null && (
            <span
              className={`text-sm font-medium tabular-nums ${
                changePct >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {formatChangePct(changePct)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Stat label="24H High" value={snapshot?.high_24h ? formatPrice(snapshot.high_24h) : "—"} />
        <Stat label="24H Low" value={snapshot?.low_24h ? formatPrice(snapshot.low_24h) : "—"} />
        <Stat label="24H Volume" value={formatVolume(snapshot?.volume_24h)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <span className="text-[13px] font-medium tabular-nums text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

export default memo(PairHeader);
