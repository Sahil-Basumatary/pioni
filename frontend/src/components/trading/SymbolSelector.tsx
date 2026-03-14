import { useEffect, useRef, useState } from "react";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const PRICE_REFRESH_MS = 30_000;

export const SYMBOLS = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "SOLUSDT", label: "SOL" },
  { symbol: "XRPUSDT", label: "XRP" },
  { symbol: "ADAUSDT", label: "ADA" },
  { symbol: "DOGEUSDT", label: "DOGE" },
] as const;

export type TradingSymbol = (typeof SYMBOLS)[number]["symbol"];

interface SymbolSelectorProps {
  selected: string;
  onSelect: (symbol: string) => void;
}

type PriceMap = Record<string, number | null>;

function formatCompactPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
    const res = await fetch(`${base}/market/prices/${symbol}`);
    if (!res.ok) return null;
    const data = await res.json();
    const num = Number(data.price);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

async function fetchAllPrices(): Promise<PriceMap> {
  const entries = await Promise.all(
    SYMBOLS.map(async ({ symbol }) => {
      const price = await fetchPrice(symbol);
      return [symbol, price] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default function SymbolSelector({ selected, onSelect }: SymbolSelectorProps) {
  const [prices, setPrices] = useState<PriceMap>({});
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const refresh = () => {
      fetchAllPrices().then((map) => {
        if (!cancelledRef.current) setPrices(map);
      });
    };
    refresh();
    const id = setInterval(refresh, PRICE_REFRESH_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {SYMBOLS.map(({ symbol, label }) => {
        const active = symbol === selected;
        const price = prices[symbol];
        return (
          <button
            key={symbol}
            onClick={() => onSelect(symbol)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04]"
            }`}
          >
            <span>{label}</span>
            {price !== null && price !== undefined && (
              <span
                className={`text-xs tabular-nums ${
                  active ? "text-white/70" : "text-[var(--text-muted)]"
                }`}
              >
                ${formatCompactPrice(price)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
