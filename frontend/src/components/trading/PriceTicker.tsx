import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectLatestTrade } from "../../features/market/marketSlice";
import type { TickerSnapshot } from "../../types/market";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const SNAPSHOT_REFRESH_MS = 30_000;
const FLASH_DURATION_MS = 500;

interface PriceTickerProps {
  symbol: string;
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

async function fetchSnapshot(symbol: string): Promise<TickerSnapshot> {
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const res = await fetch(`${base}/market/prices/${symbol}`);
  if (!res.ok) throw new Error(`ticker fetch ${res.status}`);
  return res.json();
}

function PriceTicker({ symbol }: PriceTickerProps) {
  const selectTrade = useMemo(() => selectLatestTrade(symbol), [symbol]);
  const trade = useAppSelector(selectTrade);
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(null);
  const [flashDir, setFlashDir] = useState<"up" | "down" | "">("");
  const prevPriceRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    prevPriceRef.current = null;
    setSnapshot(null);
    setFlashDir("");
    let cancelled = false;
    fetchSnapshot(symbol)
      .then((s) => { if (!cancelled) setSnapshot(s); })
      .catch(() => {});
    const interval = setInterval(() => {
      fetchSnapshot(symbol)
        .then((s) => { if (!cancelled) setSnapshot(s); })
        .catch(() => {});
    }, SNAPSHOT_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
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

  const priceStr = currentPrice !== null ? formatPrice(currentPrice) : "—";
  const changePct = snapshot?.change_pct_24h ?? null;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-baseline gap-2.5">
        <span
          className={`text-[1.75rem] font-semibold tabular-nums tracking-tight transition-colors duration-300 ${
            flashDir === "up"
              ? "text-emerald-500"
              : flashDir === "down"
                ? "text-red-500"
                : "text-[var(--text-primary)]"
          }`}
        >
          {priceStr}
        </span>
        {changePct !== null && (
          <span
            className={`text-sm font-medium tabular-nums ${
              changePct >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {formatChangePct(changePct)}
          </span>
        )}
      </div>
      <div className="h-8 w-px bg-[var(--card-border)]" />
      <div className="flex items-center gap-5">
        <Stat label="24h High" value={snapshot?.high_24h ? formatPrice(snapshot.high_24h) : "—"} />
        <Stat label="24h Low" value={snapshot?.low_24h ? formatPrice(snapshot.low_24h) : "—"} />
        <Stat label="24h Volume" value={formatVolume(snapshot?.volume_24h)} />
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
      <span className="text-[13px] font-medium tabular-nums text-[var(--text-secondary)]">
        {value}
      </span>
    </div>
  );
}

export default memo(PriceTicker);
