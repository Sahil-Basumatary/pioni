import { GATEWAY_URL } from "../../endpoints";
import type { Kline } from "../../types/market";
import type { AnalyticsInterval } from "./analyticsConfig";

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";

export function toApiInterval(interval: AnalyticsInterval): string {
  return interval === "1D" ? "1d" : interval;
}

type BinanceKlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

function fromBinance(
  symbol: string,
  interval: string,
  rows: BinanceKlineRow[],
): Kline[] {
  return rows.map((row) => ({
    symbol,
    exchange: "binance",
    interval,
    open_time: row[0],
    close_time: row[6],
    open: row[1],
    high: row[2],
    low: row[3],
    close: row[4],
    volume: row[5],
    quote_volume: row[7],
    trades: row[8],
    is_closed: true,
  }));
}

async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<Kline[]> {
  const url = `${BINANCE_KLINES_URL}?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch klines: ${res.status}`);
  const rows = (await res.json()) as BinanceKlineRow[];
  return fromBinance(symbol, interval, rows);
}

export async function fetchAnalyticsKlines(
  symbol: string,
  interval: AnalyticsInterval,
  limit = 500,
): Promise<Kline[]> {
  const apiInterval = toApiInterval(interval);
  const res = await fetch(
    `${GATEWAY_URL}/market/klines/${symbol}?interval=${apiInterval}&limit=${limit}`,
  ).catch(() => null);
  if (res?.ok) {
    const data = await res.json();
    const rows = (data.klines ?? data) as Kline[];
    if (Array.isArray(rows) && rows.length > 0) return rows;
  }
  return fetchBinanceKlines(symbol, apiInterval, limit);
}
