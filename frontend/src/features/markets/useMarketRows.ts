import { useMemo } from "react";
import { useGetPricesQuery, type PriceMap } from "../market/marketApi";
import { MARKET_CATALOG, type MarketMeta } from "./catalog";

export type MarketRow = MarketMeta & {
  price: number | null;
  changePct: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
};

function toRow(meta: MarketMeta, prices: PriceMap | undefined): MarketRow {
  const tick = prices?.[meta.symbol];
  return {
    ...meta,
    price: tick?.price != null ? Number(tick.price) : null,
    changePct: tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null,
    high: tick?.high_24h != null ? Number(tick.high_24h) : null,
    low: tick?.low_24h != null ? Number(tick.low_24h) : null,
    volume: tick?.volume_24h != null ? Number(tick.volume_24h) : null,
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
    if (favoritesOnly && !favorites.includes(row.symbol)) return false;
    if (!q) return true;
    return (
      row.symbol.toLowerCase().includes(q) ||
      row.label.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q)
    );
  });
}
