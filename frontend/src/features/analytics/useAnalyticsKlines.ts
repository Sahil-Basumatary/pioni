import { useEffect, useState } from "react";
import type { Kline } from "../../types/market";
import type { AnalyticsInterval } from "./analyticsConfig";
import { fetchAnalyticsKlines } from "./fetchAnalyticsKlines";

export function useAnalyticsKlines(
  symbol: string,
  interval: AnalyticsInterval,
): { klines: Kline[]; loading: boolean; error: string | null } {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAnalyticsKlines(symbol, interval)
      .then((rows) => {
        if (cancelled) return;
        setKlines(rows);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setKlines([]);
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  return { klines, loading, error };
}
