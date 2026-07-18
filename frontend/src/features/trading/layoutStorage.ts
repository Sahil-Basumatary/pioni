const KEY = "pioni.tradingLayout.v2";
const PRESET_KEY = "pioni.tradingLayout.preset";
export const TRADING_LAYOUT_EVENT = "pioni:trading-layout";

export type TradingLayoutSizes = {
  ticketWidth: number;
  bookWidth: number;
  bottomHeight: number;
};

export type LayoutPresetId = "classic" | "advanced" | "terminal";

export const DEFAULT_LAYOUT: TradingLayoutSizes = {
  ticketWidth: 336,
  bookWidth: 280,
  bottomHeight: 180,
};

export const LAYOUT_PRESETS: Record<
  LayoutPresetId,
  { label: string; sizes: TradingLayoutSizes }
> = {
  classic: {
    label: "Classic",
    sizes: { ticketWidth: 300, bookWidth: 240, bottomHeight: 150 },
  },
  advanced: {
    label: "Advanced",
    sizes: { ...DEFAULT_LAYOUT },
  },
  terminal: {
    label: "Terminal",
    sizes: { ticketWidth: 260, bookWidth: 340, bottomHeight: 220 },
  },
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

export function readLayoutPreset(): LayoutPresetId {
  const raw = localStorage.getItem(PRESET_KEY);
  if (raw === "classic" || raw === "advanced" || raw === "terminal") return raw;
  return "advanced";
}

export function applyLayoutPreset(id: LayoutPresetId): TradingLayoutSizes {
  const sizes = { ...LAYOUT_PRESETS[id].sizes };
  writeTradingLayout(sizes);
  localStorage.setItem(PRESET_KEY, id);
  window.dispatchEvent(
    new CustomEvent(TRADING_LAYOUT_EVENT, { detail: { id, sizes } }),
  );
  return sizes;
}
