import { MARKET_CATALOG, type MarketMeta } from "../markets/catalog";
import type { PriceMap } from "../market/marketApi";

export type LiveMarketRow = MarketMeta & {
  price: number | null;
  changePct: number | null;
  volume: number | null;
};

export type MarketingChipId =
  | "all"
  | "leverage10"
  | "Layer 1"
  | "Layer 2"
  | "Payment and value"
  | "Infrastructure"
  | "Culture";

export const MARKETING_CHIPS: { id: MarketingChipId; label: string }[] = [
  { id: "all", label: "All markets" },
  { id: "Layer 1", label: "Layer 1" },
  { id: "Layer 2", label: "Layer 2" },
  { id: "Payment and value", label: "Payment" },
  { id: "Infrastructure", label: "Infrastructure" },
  { id: "Culture", label: "Culture" },
  { id: "leverage10", label: "10x margin" },
];

export function chipLabel(chip: MarketingChipId): string {
  return MARKETING_CHIPS.find((c) => c.id === chip)?.label ?? "All markets";
}

export function toLiveRows(prices: PriceMap | undefined): LiveMarketRow[] {
  return MARKET_CATALOG.map((meta) => {
    const tick = prices?.[meta.symbol];
    const price = tick?.price != null ? Number(tick.price) : null;
    const changePct =
      tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null;
    const volume =
      tick?.volume_24h != null && tick.volume_24h !== ""
        ? Number(tick.volume_24h)
        : null;
    return {
      ...meta,
      price: Number.isFinite(price) ? price : null,
      changePct: Number.isFinite(changePct) ? changePct : null,
      volume: Number.isFinite(volume) ? volume : null,
    };
  });
}

export function filterByChip(
  rows: LiveMarketRow[],
  chip: MarketingChipId,
): LiveMarketRow[] {
  if (chip === "all") return rows;
  if (chip === "leverage10") return rows.filter((r) => (r.marginLeverage ?? 0) >= 10);
  return rows.filter((r) => r.category === chip);
}

export function featuredRows(rows: LiveMarketRow[], limit = 3): LiveMarketRow[] {
  if (!rows.length) return [];
  // A feed card with no price reads as broken, so unpriced rows never lead.
  const priced = rows.filter((r) => r.price != null);
  return (priced.length ? priced : rows)
    .slice()
    .sort((a, b) => {
      const volA = a.volume ?? 0;
      const volB = b.volume ?? 0;
      if (volA !== volB) return volB - volA;
      return Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0);
    })
    .slice(0, limit);
}

export function topMovers(rows: LiveMarketRow[], limit = 6): LiveMarketRow[] {
  return [...rows]
    .filter((r) => r.changePct != null)
    .sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0))
    .slice(0, limit);
}

export function highestActivity(rows: LiveMarketRow[], limit = 6): LiveMarketRow[] {
  return [...rows]
    .filter((r) => r.volume != null && r.volume > 0)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, limit);
}

export function changeTone(changePct: number | null): string {
  if (changePct == null) return "text-[var(--text-muted)]";
  return changePct >= 0 ? "text-emerald-400" : "text-rose-400";
}
