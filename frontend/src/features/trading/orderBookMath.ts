import type { PriceLevel } from "../orders/ordersApi";

/** BTC/USD-style ticks — matches the reference grouping menu. */
export const GROUPINGS = [0.1, 0.5, 1, 2.5, 5, 10, 25, 50, 100] as const;

export function formatGroupStep(step: number): string {
  if (step < 1) return step.toFixed(2);
  if (step < 10) return step.toFixed(1);
  return String(step);
}

function bucketKey(price: number, step: number, side: "bid" | "ask"): number {
  const scaled = price / step;
  const bucket =
    side === "bid" ? Math.floor(scaled + 1e-9) : Math.ceil(scaled - 1e-9);
  return Number((bucket * step).toFixed(10));
}

export function groupLevels(
  levels: PriceLevel[],
  step: number,
  side: "bid" | "ask",
): PriceLevel[] {
  if (!levels.length || step <= 0) return levels;
  const buckets = new Map<number, number>();
  for (const level of levels) {
    const price = Number(level.price);
    const qty = Number(level.total_quantity);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) continue;
    const key = bucketKey(price, step, side);
    buckets.set(key, (buckets.get(key) ?? 0) + qty);
  }
  const grouped = [...buckets.entries()].map(([price, total_quantity]) => ({
    price: String(price),
    total_quantity: String(total_quantity),
  }));
  grouped.sort((a, b) =>
    side === "ask" ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price),
  );
  return grouped;
}

export type DepthLevel = PriceLevel & { depthPct: number; cumQty: number };

/** Cumulative depth from the touch — bars + TOTAL column grow away from mid. */
export function withCumulativeDepth(
  levels: PriceLevel[],
  fromMidFirst: boolean,
): DepthLevel[] {
  if (!levels.length) return [];
  const qtys = levels.map((l) => Number(l.total_quantity));
  const cum = new Array<number>(levels.length);
  let run = 0;
  if (fromMidFirst) {
    for (let i = 0; i < levels.length; i++) {
      run += Number.isFinite(qtys[i]) ? qtys[i]! : 0;
      cum[i] = run;
    }
  } else {
    for (let i = levels.length - 1; i >= 0; i--) {
      run += Number.isFinite(qtys[i]) ? qtys[i]! : 0;
      cum[i] = run;
    }
  }
  const max = Math.max(0, ...cum);
  return levels.map((level, i) => ({
    ...level,
    cumQty: cum[i]!,
    depthPct: max > 0 ? Math.min(100, (cum[i]! / max) * 100) : 0,
  }));
}
