import { useMemo } from "react";
import type { AnalyticsInterval } from "./analyticsConfig";
import { useAnalyticsKlines } from "./useAnalyticsKlines";
import {
  aggressorSeries,
  priceSeries,
  rollingVolatilitySeries,
  tradeCountSeries,
  volumeSeries,
} from "./analyticsSeries";
import AnalyticsMetricChart from "./AnalyticsMetricChart";
import type { AnalyticsChartKind } from "./AnalyticsMetricChart";

type WidgetId =
  | "price"
  | "aggressor"
  | "trade-count"
  | "volatility"
  | "volumes";

const KIND: Record<WidgetId, AnalyticsChartKind> = {
  price: "area",
  aggressor: "line",
  "trade-count": "histogram",
  volatility: "area",
  volumes: "histogram",
};

type Props = {
  id: WidgetId;
  symbol: string;
  interval: AnalyticsInterval;
};

export default function AnalyticsKlineWidget({ id, symbol, interval }: Props) {
  const { klines, loading, error } = useAnalyticsKlines(symbol, interval);
  const data = useMemo(() => {
    switch (id) {
      case "price":
        return priceSeries(klines);
      case "aggressor":
        return aggressorSeries(klines);
      case "trade-count":
        return tradeCountSeries(klines);
      case "volatility":
        return rollingVolatilitySeries(klines);
      case "volumes":
        return volumeSeries(klines);
      default:
        return [];
    }
  }, [id, klines]);

  const priceFormat =
    id === "price"
      ? { type: "price" as const, precision: 1 }
      : id === "volatility"
        ? { type: "price" as const, precision: 2 }
        : id === "aggressor"
          ? { type: "price" as const, precision: 2 }
          : { type: "volume" as const };

  return (
    <AnalyticsMetricChart
      data={data}
      kind={KIND[id]}
      loading={loading}
      error={error}
      priceFormat={priceFormat}
    />
  );
}
