export const ANALYTICS_INTERVALS = ["1m", "15m", "1h", "4h", "1D"] as const;
export const ANALYTICS_OVERFLOW_INTERVALS = ["5m"] as const;
export type AnalyticsInterval =
  | (typeof ANALYTICS_INTERVALS)[number]
  | (typeof ANALYTICS_OVERFLOW_INTERVALS)[number];

export const ANALYTICS_WIDGETS = [
  { id: "price", title: "Price" },
  { id: "aggressor", title: "Aggressor differential" },
  { id: "trade-count", title: "Trade count" },
  { id: "volatility", title: "Rolling volatility" },
  { id: "volumes", title: "Trading volumes" },
  { id: "orderbook", title: "Order book imbalance and slippage" },
] as const;

export type AnalyticsWidgetId = (typeof ANALYTICS_WIDGETS)[number]["id"];

export const DEFAULT_ANALYTICS_SYMBOL = "BTCUSDT";

export function symbolToAnalyticsPath(symbol: string): string {
  return `/analytics/${symbol.toLowerCase()}`;
}

export function analyticsPathToSymbol(param: string | undefined): string {
  if (!param) return DEFAULT_ANALYTICS_SYMBOL;
  return param.replace(/-/g, "").toUpperCase();
}
