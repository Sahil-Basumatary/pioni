import { memo } from "react";
import { useGetPricesQuery } from "../../features/market/marketApi";

const PRICE_REFRESH_MS = 30_000;

export const SYMBOLS = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "SOLUSDT", label: "SOL" },
  { symbol: "XRPUSDT", label: "XRP" },
  { symbol: "ADAUSDT", label: "ADA" },
  { symbol: "DOGEUSDT", label: "DOGE" },
  { symbol: "LTCUSDT", label: "LTC" },
  { symbol: "LINKUSDT", label: "LINK" },
  { symbol: "AVAXUSDT", label: "AVAX" },
  { symbol: "DOTUSDT", label: "DOT" },
  { symbol: "APTUSDT", label: "APT" },
  { symbol: "ATOMUSDT", label: "ATOM" },
  { symbol: "BCHUSDT", label: "BCH" },
  { symbol: "POLUSDT", label: "POL" },
  { symbol: "XLMUSDT", label: "XLM" },
  { symbol: "ARBUSDT", label: "ARB" },
] as const;

export type TradingSymbol = (typeof SYMBOLS)[number]["symbol"];

interface SymbolSelectorProps {
  selected: string;
  onSelect: (symbol: string) => void;
}

function formatCompactPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function SymbolSelector({ selected, onSelect }: SymbolSelectorProps) {
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: PRICE_REFRESH_MS,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {SYMBOLS.map(({ symbol, label }) => {
        const active = symbol === selected;
        const raw = prices?.[symbol]?.price;
        const price = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
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
            {price !== null && (
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

export default memo(SymbolSelector);
