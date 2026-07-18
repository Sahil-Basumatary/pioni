import { useEffect, useMemo, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { useGetOrderBookQuery } from "../orders/ordersApi";
import AnalyticsMetricChart from "./AnalyticsMetricChart";
import type { SeriesPoint } from "./analyticsSeries";

const SAMPLE_MS = 3_000;
const MAX_POINTS = 240;

type Sample = { at: number; imbalance: number; slippageBps: number };

function levelQty(level: { total_quantity: string }): number {
  const n = Number(level.total_quantity);
  return Number.isFinite(n) ? n : 0;
}

function computeSample(
  bids: { price: string; total_quantity: string }[],
  asks: { price: string; total_quantity: string }[],
  bestBid: string | null,
  bestAsk: string | null,
): Sample {
  const bidVol = bids.reduce((s, l) => s + levelQty(l), 0);
  const askVol = asks.reduce((s, l) => s + levelQty(l), 0);
  const total = bidVol + askVol;
  const imbalance = total > 0 ? ((bidVol - askVol) / total) * 100 : 0;

  const mid =
    bestBid != null && bestAsk != null
      ? (Number(bestBid) + Number(bestAsk)) / 2
      : null;
  let slippageBps = 0;
  if (mid != null && mid > 0 && asks.length > 0) {
    const target = Math.max(askVol * 0.05, Number(asks[0].total_quantity) || 0);
    let filled = 0;
    let cost = 0;
    for (const level of asks) {
      const qty = levelQty(level);
      const px = Number(level.price);
      if (!Number.isFinite(px) || qty <= 0) continue;
      const take = Math.min(qty, target - filled);
      cost += take * px;
      filled += take;
      if (filled >= target) break;
    }
    if (filled > 0) {
      const avg = cost / filled;
      slippageBps = ((avg - mid) / mid) * 10_000;
    }
  }

  return { at: Date.now(), imbalance, slippageBps };
}

export default function AnalyticsOrderBookWidget({
  symbol,
}: {
  symbol: string;
}) {
  const { data: book, error, isFetching } = useGetOrderBookQuery(
    { symbol, depth: 25 },
    { pollingInterval: SAMPLE_MS },
  );
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => {
    setSamples([]);
  }, [symbol]);

  useEffect(() => {
    if (!book) return;
    const next = computeSample(
      book.bids ?? [],
      book.asks ?? [],
      book.best_bid,
      book.best_ask,
    );
    setSamples((prev) => {
      const last = prev[prev.length - 1];
      if (last && next.at - last.at < SAMPLE_MS - 200) return prev;
      return [...prev, next].slice(-MAX_POINTS);
    });
  }, [book]);

  const imbalanceData: SeriesPoint[] = useMemo(
    () =>
      samples.map((s) => ({
        time: Math.floor(s.at / 1000) as UTCTimestamp,
        value: s.imbalance,
      })),
    [samples],
  );

  const last = samples[samples.length - 1];
  const errMsg =
    error && imbalanceData.length === 0
      ? "Order book unavailable"
      : null;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-[var(--text-muted)]">Imbalance</span>
        <span className="font-medium tabular-nums text-[var(--text-primary)]">
          {last ? `${last.imbalance.toFixed(3)}%` : isFetching ? "…" : "—"}
        </span>
        <span className="text-[var(--text-muted)]">Slippage</span>
        <span className="font-medium tabular-nums text-[var(--text-primary)]">
          {last ? `${last.slippageBps.toFixed(2)} bps` : isFetching ? "…" : "—"}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <AnalyticsMetricChart
          data={imbalanceData}
          kind="line"
          loading={isFetching && imbalanceData.length === 0}
          error={errMsg}
          priceFormat={{ type: "price", precision: 2 }}
        />
      </div>
    </div>
  );
}
