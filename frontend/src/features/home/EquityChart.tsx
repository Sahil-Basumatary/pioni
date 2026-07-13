import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type AreaData,
  type Time,
} from "lightweight-charts";
import type { PnlChartPoint } from "../portfolio/portfolioApi";
import { ArrowDownIcon, ArrowTopIcon } from "../../components/shell/shellIcons";

type EquityChartProps = {
  points: PnlChartPoint[];
  fallbackValue: number;
  days: number;
};

function toSeries(
  points: PnlChartPoint[],
  fallbackValue: number,
  days: number,
): AreaData<Time>[] {
  if (points.length > 0) {
    return points.map((p) => ({
      time: p.date as Time,
      value: Number(p.total_value),
    }));
  }
  const out: AreaData<Time>[] = [];
  const now = Date.now();
  for (let i = days; i >= 0; i -= 1) {
    const d = new Date(now - i * 86_400_000);
    out.push({ time: d.toISOString().slice(0, 10) as Time, value: fallbackValue });
  }
  return out;
}

export default function EquityChart({ points, fallbackValue, days }: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const series = useMemo(
    () => toSeries(points, fallbackValue, days),
    [points, fallbackValue, days],
  );
  const values = series.map((p) => p.value);
  const high = values.length ? Math.max(...values) : fallbackValue;
  const low = values.length ? Math.min(...values) : fallbackValue;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: 106,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6A6A6A",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });
    const area = chart.addSeries(AreaSeries, {
      lineColor: "#2A2A2A",
      topColor: "rgba(42, 42, 42, 0.28)",
      bottomColor: "rgba(42, 42, 42, 0.02)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = area;
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(series);
    chartRef.current?.timeScale().fitContent();
  }, [series]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <div className="flex h-[130px] flex-grow flex-col gap-0">
      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <ArrowTopIcon className="h-3 w-3" />
        <span>{fmt(high)}USD</span>
      </div>
      <div ref={containerRef} className="h-[106px] w-full flex-grow" />
      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <ArrowDownIcon className="h-3 w-3" />
        <span>{fmt(low)}USD</span>
      </div>
    </div>
  );
}
