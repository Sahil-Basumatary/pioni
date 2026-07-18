import type { Kline } from "../../types/market";
import type { UTCTimestamp } from "lightweight-charts";

export type SeriesPoint = { time: UTCTimestamp; value: number };

function t(k: Kline): UTCTimestamp {
  return (k.open_time / 1000) as UTCTimestamp;
}

export function priceSeries(klines: Kline[]): SeriesPoint[] {
  return klines.map((k) => ({ time: t(k), value: Number(k.close) }));
}

export function aggressorSeries(klines: Kline[]): SeriesPoint[] {
  let cumulative = 0;
  return klines.map((k) => {
    const open = Number(k.open);
    const close = Number(k.close);
    const vol = Number(k.volume);
    const sign = close === open ? 0 : close > open ? 1 : -1;
    cumulative += sign * vol;
    return { time: t(k), value: cumulative };
  });
}

export function tradeCountSeries(klines: Kline[]): SeriesPoint[] {
  return klines.map((k) => ({
    time: t(k),
    value: Number(k.trades) || 0,
  }));
}

export function volumeSeries(klines: Kline[]): SeriesPoint[] {
  return klines.map((k) => ({
    time: t(k),
    value: Number(k.volume) || 0,
  }));
}

export function rollingVolatilitySeries(
  klines: Kline[],
  window = 20,
): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const returns: number[] = [];
  for (let i = 0; i < klines.length; i += 1) {
    const close = Number(klines[i].close);
    const prev = i > 0 ? Number(klines[i - 1].close) : close;
    const ret = prev > 0 ? Math.log(close / prev) : 0;
    returns.push(ret);
    if (i < window) continue;
    const slice = returns.slice(i - window + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance =
      slice.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(slice.length - 1, 1);
    const vol = Math.sqrt(variance) * Math.sqrt(365 * 24) * 100;
    out.push({ time: t(klines[i]), value: Number.isFinite(vol) ? vol : 0 });
  }
  return out;
}
