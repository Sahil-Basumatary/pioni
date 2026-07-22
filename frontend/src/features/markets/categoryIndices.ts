import type { MarketRow } from "./useMarketRows";

export type CategoryIndexId =
  | "defi"
  | "infrastructure"
  | "industry"
  | "payments"
  | "gaming"
  | "meme"
  | "utility"
  | "interop"
  | "layer1"
  | "layer2"
  | "dex"
  | "privacy"
  | "nft"
  | "stablecoin"
  | "culture";

export type CategoryIndexDef = {
  id: CategoryIndexId;
  label: string;
  color: string;
  catalogMatch?: string;
};

/** Stroke colors sampled from the live Pro Category indices chart. */
export const CATEGORY_INDICES: CategoryIndexDef[] = [
  { id: "defi", label: "DeFi", color: "#38C7EF" },
  { id: "infrastructure", label: "Infrastructure", color: "#CF0F11" },
  { id: "industry", label: "Industry", color: "#54E6AB" },
  { id: "payments", label: "Payment and value", color: "#FF9900", catalogMatch: "Payment and value" },
  { id: "gaming", label: "Gaming", color: "#2F80E5" },
  { id: "meme", label: "Meme coins", color: "#C2A733" },
  { id: "utility", label: "Utility", color: "#2A5ADA" },
  { id: "interop", label: "Interoperability", color: "#8A61FF" },
  { id: "layer1", label: "Layer 1", color: "#C74CE3", catalogMatch: "Layer 1" },
  { id: "layer2", label: "Layer 2", color: "#8247E5" },
  { id: "dex", label: "DEX", color: "#EE326E" },
  { id: "privacy", label: "Privacy", color: "#FF6600" },
  { id: "nft", label: "NFT", color: "#EF8E35" },
  { id: "stablecoin", label: "Stablecoin", color: "#12BC34" },
  { id: "culture", label: "Culture", color: "#51E286", catalogMatch: "Culture" },
];

export type CategoryRange = "1D" | "1W" | "1M" | "3M" | "1Y";

export const CATEGORY_RANGES: CategoryRange[] = ["1D", "1W", "1M", "3M", "1Y"];

const RANGE_POINTS: Record<CategoryRange, number> = {
  "1D": 48,
  "1W": 56,
  "1M": 60,
  "3M": 64,
  "1Y": 72,
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function targetChange(def: CategoryIndexDef, rows: MarketRow[]): number {
  if (def.catalogMatch) {
    const matched = rows.filter((r) => r.category === def.catalogMatch && r.changePct != null);
    if (matched.length) {
      return matched.reduce((sum, r) => sum + (r.changePct ?? 0), 0) / matched.length;
    }
  }
  const h = hashSeed(def.id);
  return ((h % 1400) / 100) - 5;
}

/** Percent return series starting at 0, drifting toward category performance. */
export function categorySeries(
  def: CategoryIndexDef,
  rows: MarketRow[],
  range: CategoryRange,
): number[] {
  const count = RANGE_POINTS[range];
  const target = targetChange(def, rows);
  let h = hashSeed(`${def.id}:${range}`);
  const points: number[] = [0];
  let v = 0;
  for (let i = 1; i < count; i += 1) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const t = i / (count - 1);
    const pull = (target - v) * 0.12;
    const noise = ((h % 1000) / 1000 - 0.5) * (1.8 + t * 1.2);
    v += pull + noise;
    points.push(v);
  }
  points[points.length - 1] = target;
  return points;
}

export function seriesPath(
  values: number[],
  width: number,
  height: number,
  min: number,
  max: number,
): string {
  if (!values.length) return "";
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function axisTicks(min: number, max: number): number[] {
  const lo = Math.floor(min);
  const hi = Math.ceil(max);
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 1) ticks.push(t);
  if (ticks.length < 2) return [lo - 1, lo, lo + 1];
  return ticks;
}
