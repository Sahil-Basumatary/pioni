import type { Kline } from "../../types/market";
import type { AnalyticsInterval } from "./analyticsConfig";

const DEFAULT_GATEWAY_URL = "http://localhost:8000";

export function toApiInterval(interval: AnalyticsInterval): string {
  return interval === "1D" ? "1d" : interval;
}

export async function fetchAnalyticsKlines(
  symbol: string,
  interval: AnalyticsInterval,
  limit = 500,
): Promise<Kline[]> {
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const apiInterval = toApiInterval(interval);
  const res = await fetch(
    `${base}/market/klines/${symbol}?interval=${apiInterval}&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch klines: ${res.status}`);
  const data = await res.json();
  return data.klines ?? data;
}
