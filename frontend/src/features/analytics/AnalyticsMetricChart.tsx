import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  TickMarkType,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { SeriesPoint } from "./analyticsSeries";

const LINE = "#2A2A2A";
const TOP = "rgba(42, 42, 42, 0.22)";
const BOTTOM = "rgba(42, 42, 42, 0.02)";
const HIST = "rgba(42, 42, 42, 0.45)";
const GRID = "rgba(0, 0, 0, 0.05)";
const MUTED = "#6A6A6A";

export type AnalyticsChartKind = "area" | "line" | "histogram";

type Props = {
  data: SeriesPoint[];
  kind?: AnalyticsChartKind;
  loading?: boolean;
  error?: string | null;
  priceFormat?: { type: "price" | "volume" | "percent"; precision?: number };
};

function formatTickMark(time: UTCTimestamp, tickMarkType: TickMarkType): string {
  const d = new Date(time * 1000);
  if (tickMarkType === TickMarkType.Year) {
    return String(d.getUTCFullYear());
  }
  if (tickMarkType === TickMarkType.Month) {
    return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  }
  if (
    tickMarkType === TickMarkType.DayOfMonth ||
    tickMarkType === TickMarkType.Time ||
    tickMarkType === TickMarkType.TimeWithSeconds
  ) {
    const weekday = d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    return `${weekday} ${d.getUTCDate()}`;
  }
  return "";
}

export default function AnalyticsMetricChart({
  data,
  kind = "area",
  loading = false,
  error = null,
  priceFormat,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<
    ISeriesApi<"Area"> | ISeriesApi<"Line"> | ISeriesApi<"Histogram"> | null
  >(null);
  const formatKey = `${priceFormat?.type ?? "price"}:${priceFormat?.precision ?? ""}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const format =
      priceFormat?.type === "volume"
        ? { type: "volume" as const }
        : {
            type: "price" as const,
            precision: priceFormat?.precision ?? 2,
            minMove: 10 ** -(priceFormat?.precision ?? 2),
          };
    const chart = createChart(el, {
      width: Math.max(1, el.clientWidth || 320),
      height: Math.max(1, el.clientHeight || 280),
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: MUTED,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
          formatTickMark(time as UTCTimestamp, tickMarkType),
      },
      localization: {
        locale: "en-US",
      },
      handleScroll: { vertTouchDrag: false },
    });
    chartRef.current = chart;

    const common = {
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineColor: LINE,
      priceLineWidth: 1 as const,
      priceLineStyle: LineStyle.Dotted,
      priceFormat: format,
    };

    if (kind === "histogram") {
      seriesRef.current = chart.addSeries(HistogramSeries, {
        color: HIST,
        ...common,
      });
    } else if (kind === "line") {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: LINE,
        lineWidth: 2,
        ...common,
      });
    } else {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: LINE,
        topColor: TOP,
        bottomColor: BOTTOM,
        lineWidth: 2,
        ...common,
      });
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) chart.applyOptions({ width, height });
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [kind, formatKey]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(data as { time: Time; value: number }[]);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {loading && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-muted)]">
          Loading…
        </div>
      )}
    </div>
  );
}
