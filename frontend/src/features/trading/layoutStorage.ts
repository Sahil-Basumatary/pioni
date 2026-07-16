const KEY = "pioni.tradingLayout.v2";

export type TradingLayoutSizes = {
  ticketWidth: number;
  bookWidth: number;
  bottomHeight: number;
};

export const DEFAULT_LAYOUT: TradingLayoutSizes = {
  ticketWidth: 336,
  bookWidth: 280,
  bottomHeight: 180,
};

export const LAYOUT_LIMITS = {
  ticketWidth: { min: 220, max: 420 },
  bookWidth: { min: 200, max: 420 },
  bottomHeight: { min: 120, max: 420 },
  chartMinWidth: 280,
} as const;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function readTradingLayout(): TradingLayoutSizes {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed = JSON.parse(raw) as Partial<TradingLayoutSizes>;
    return {
      ticketWidth: clamp(
        Number(parsed.ticketWidth) || DEFAULT_LAYOUT.ticketWidth,
        LAYOUT_LIMITS.ticketWidth.min,
        LAYOUT_LIMITS.ticketWidth.max,
      ),
      bookWidth: clamp(
        Number(parsed.bookWidth) || DEFAULT_LAYOUT.bookWidth,
        LAYOUT_LIMITS.bookWidth.min,
        LAYOUT_LIMITS.bookWidth.max,
      ),
      bottomHeight: clamp(
        Number(parsed.bottomHeight) || DEFAULT_LAYOUT.bottomHeight,
        LAYOUT_LIMITS.bottomHeight.min,
        LAYOUT_LIMITS.bottomHeight.max,
      ),
    };
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

export function writeTradingLayout(sizes: TradingLayoutSizes): void {
  localStorage.setItem(KEY, JSON.stringify(sizes));
}
