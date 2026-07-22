import type { MarketRow } from "./useMarketRows";
import { CATEGORY_INDICES, type CategoryIndexDef } from "./categoryIndices";

export type HeatMetric = "volume" | "mcap";

export type HeatDatum = {
  id: string;
  label: string;
  color: string;
  value: number;
  changePct: number | null;
};

export type HeatRect = HeatDatum & {
  x: number;
  y: number;
  w: number;
  h: number;
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function categoryRows(def: CategoryIndexDef, rows: MarketRow[]): MarketRow[] {
  if (!def.catalogMatch) return [];
  return rows.filter((r) => r.category === def.catalogMatch);
}

function syntheticVolume(def: CategoryIndexDef): number {
  const h = hashSeed(def.id);
  return 500_000 + (h % 20_000_000);
}

function syntheticMcap(def: CategoryIndexDef, volume: number): number {
  const h = hashSeed(`mcap:${def.id}`);
  const mult = 80 + (h % 400);
  return volume * mult;
}

export function buildHeatData(rows: MarketRow[], metric: HeatMetric): HeatDatum[] {
  return CATEGORY_INDICES.map((def) => {
    const matched = categoryRows(def, rows);
    const liveVol = matched.reduce((sum, r) => sum + (r.volume ?? 0), 0);
    const changeVals = matched
      .map((r) => r.changePct)
      .filter((n): n is number => n != null && Number.isFinite(n));
    const changePct =
      changeVals.length > 0
        ? changeVals.reduce((a, b) => a + b, 0) / changeVals.length
        : ((hashSeed(def.id) % 900) / 100) - 3;
    const volume = liveVol > 0 ? liveVol : syntheticVolume(def);
    const value = metric === "volume" ? volume : syntheticMcap(def, volume);
    return {
      id: def.id,
      label: def.label,
      color: def.color,
      value,
      changePct,
    };
  }).filter((d) => d.value > 0);
}

/** Binary split treemap — area ∝ value, 2px gutters like Pro. */
export function layoutTreemap(
  data: HeatDatum[],
  width: number,
  height: number,
  gap = 2,
): HeatRect[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (!sorted.length || width <= 0 || height <= 0) return [];
  const out: HeatRect[] = [];

  function split(items: HeatDatum[], x: number, y: number, w: number, h: number) {
    if (!items.length || w <= gap || h <= gap) return;
    if (items.length === 1) {
      const d = items[0];
      out.push({ ...d, x, y, w: Math.max(0, w - gap), h: Math.max(0, h - gap) });
      return;
    }
    const sum = items.reduce((s, d) => s + d.value, 0) || 1;
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < items.length; i += 1) {
      acc += items[i].value;
      if (acc >= sum / 2) {
        cut = Math.max(1, i + 1);
        break;
      }
    }
    const left = items.slice(0, cut);
    const right = items.slice(cut);
    const leftSum = left.reduce((s, d) => s + d.value, 0);
    const frac = leftSum / sum;
    if (w >= h) {
      const lw = w * frac;
      split(left, x, y, lw, h);
      split(right, x + lw, y, w - lw, h);
    } else {
      const th = h * frac;
      split(left, x, y, w, th);
      split(right, x, y + th, w, h - th);
    }
  }

  split(sorted, 0, 0, width, height);
  return out;
}

/** Pro uses rgba(20,158,97|245,57,94) with alpha scaled by |change|, capped ~0.32. */
export function heatFill(changePct: number | null, scaled: boolean): string {
  const change = changePct ?? 0;
  if (change === 0) return "rgba(104, 107, 130, 0.12)";
  const mag = Math.min(Math.abs(change) / 5, 1);
  const alpha = scaled ? 0.12 + mag * 0.2 : 0.32;
  if (change > 0) return `rgba(20, 158, 97, ${alpha})`;
  return `rgba(245, 57, 94, ${alpha})`;
}

export function formatHeatValue(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T USD`;
  if (abs >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)}B USD`;
  }
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)}M USD`;
  }
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K USD`;
  return `${n.toFixed(0)} USD`;
}
