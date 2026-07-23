import { useMemo } from "react";
import { useGetPricesQuery, type PriceMap } from "../market/marketApi";
import {
  FOREX_CATALOG,
  MARKET_CATALOG,
  type ForexMeta,
  type MarketMeta,
} from "./catalog";

export type SettleOverlay = "usd" | "base";
export type ContractKind = "perp" | "fixed";

export type MarketRow = MarketMeta & {
  price: number | null;
  changePct: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  quote?: string;
  leverage?: number | null;
  fundingRate?: number | null;
  titleSuffix?: string;
  settleOverlay?: SettleOverlay;
  contractKind?: ContractKind;
  tradeSymbol?: string;
};

const FIXED_EXPIRIES = [
  { code: "250731", label: "31Jul26" },
  { code: "250925", label: "25Sep26" },
  { code: "251225", label: "25Dec26" },
] as const;

function toRow(meta: MarketMeta, prices: PriceMap | undefined): MarketRow {
  const tick = prices?.[meta.symbol];
  return {
    ...meta,
    quote: "USD",
    price: tick?.price != null ? Number(tick.price) : null,
    changePct: tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null,
    high: tick?.high_24h != null ? Number(tick.high_24h) : null,
    low: tick?.low_24h != null ? Number(tick.low_24h) : null,
    volume: tick?.volume_24h != null ? Number(tick.volume_24h) : null,
  };
}

function paperFunding(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i += 1) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  return ((h % 41) - 20) / 100;
}

function inverseLeverage(label: string): number {
  return label === "BTC" || label === "ETH" ? 50 : 25;
}

function forexPaperRow(meta: ForexMeta): MarketRow {
  let h = 0;
  for (let i = 0; i < meta.symbol.length; i += 1) h = (h * 31 + meta.symbol.charCodeAt(i)) >>> 0;
  const driftPct = ((h % 80) - 40) / 100;
  const price = meta.mid * (1 + driftPct / 100);
  const low = meta.mid * (1 - Math.abs(driftPct) / 100 - 0.001);
  const high = meta.mid * (1 + Math.abs(driftPct) / 100 + 0.002);
  return {
    symbol: meta.symbol,
    label: meta.label,
    name: meta.name,
    category: meta.category,
    quote: meta.quote,
    price,
    changePct: driftPct,
    high,
    low,
    volume: meta.volume,
  };
}

export function useMarketRows(pollingInterval = 15_000): {
  rows: MarketRow[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useGetPricesQuery(undefined, { pollingInterval });
  const rows = useMemo(
    () => MARKET_CATALOG.map((meta) => toRow(meta, data)),
    [data],
  );
  return { rows, isLoading, isError };
}

export function useForexRows(): MarketRow[] {
  return useMemo(() => FOREX_CATALOG.map(forexPaperRow), []);
}

export function asMarginRows(rows: MarketRow[]): MarketRow[] {
  return rows.map((row) => ({
    ...row,
    leverage: row.marginLeverage ?? 5,
  }));
}

export function asFuturesRows(rows: MarketRow[]): MarketRow[] {
  return rows.map((row) => ({
    ...row,
    titleSuffix: "Perp",
    leverage: row.futuresLeverage ?? 50,
    fundingRate: paperFunding(row.symbol),
    settleOverlay: "usd" as const,
    contractKind: "perp" as const,
    tradeSymbol: row.symbol,
  }));
}

export function asInverseFuturesRows(rows: MarketRow[]): MarketRow[] {
  return rows.map((row) => ({
    ...row,
    titleSuffix: "Inv Perp",
    leverage: inverseLeverage(row.label),
    fundingRate: paperFunding(`inv-${row.symbol}`),
    settleOverlay: "base" as const,
    contractKind: "perp" as const,
    tradeSymbol: row.symbol,
  }));
}

export function asFixedFuturesRows(rows: MarketRow[]): MarketRow[] {
  return rows.flatMap((row) =>
    FIXED_EXPIRIES.map((exp) => ({
      ...row,
      symbol: `${row.symbol}:FF:${exp.code}`,
      titleSuffix: `Future ${exp.label}`,
      leverage: Math.min(row.futuresLeverage ?? 50, 50),
      fundingRate: 0,
      settleOverlay: "usd" as const,
      contractKind: "fixed" as const,
      tradeSymbol: row.symbol,
      volume: row.volume != null ? row.volume * 0.08 : null,
      changePct: null,
      high: null,
      low: null,
    })),
  );
}

export function asFixedInverseFuturesRows(rows: MarketRow[]): MarketRow[] {
  return rows.flatMap((row) =>
    FIXED_EXPIRIES.map((exp) => ({
      ...row,
      symbol: `${row.symbol}:FI:${exp.code}`,
      titleSuffix: `Future Inv ${exp.label}`,
      leverage: inverseLeverage(row.label),
      fundingRate: 0,
      settleOverlay: "base" as const,
      contractKind: "fixed" as const,
      tradeSymbol: row.symbol,
      volume: row.volume != null ? row.volume * 0.05 : null,
      changePct: null,
      high: null,
      low: null,
    })),
  );
}

export type MarketSort =
  | "volume"
  | "change"
  | "price"
  | "name"
  | "gainers"
  | "losers";

export function sortMarketRows(rows: MarketRow[], sort: MarketSort): MarketRow[] {
  const copy = [...rows];
  switch (sort) {
    case "gainers":
    case "change":
      return copy.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity));
    case "losers":
      return copy.sort((a, b) => (a.changePct ?? Infinity) - (b.changePct ?? Infinity));
    case "price":
      return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "name":
      return copy.sort((a, b) => a.label.localeCompare(b.label));
    case "volume":
    default:
      return copy.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  }
}

export function filterMarketRows(
  rows: MarketRow[],
  query: string,
  favoritesOnly: boolean,
  favorites: string[],
): MarketRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    const favKey = row.tradeSymbol ?? row.symbol;
    if (favoritesOnly && !favorites.includes(favKey) && !favorites.includes(row.symbol)) {
      return false;
    }
    if (!q) return true;
    const pair = `${row.label}/${row.quote ?? "USD"}`.toLowerCase();
    return (
      row.symbol.toLowerCase().includes(q) ||
      row.label.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q) ||
      pair.includes(q) ||
      (row.titleSuffix ? `${row.label} ${row.titleSuffix}`.toLowerCase().includes(q) : false)
    );
  });
}
