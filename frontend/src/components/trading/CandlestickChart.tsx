import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import type { Kline } from "../../types/market";
import { useLanguage } from "../../features/auth/LanguageProvider";
import type { MessageKey } from "../../features/i18n/translate";
import { GATEWAY_URL } from "../../endpoints";

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

const INTERVAL_LABEL: Record<Interval, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "D",
};

type ChartTool = "crosshair" | "trend" | "horiz" | "fib" | "text" | "measure";

const TOOLS: { id: ChartTool; labelKey: MessageKey; ready: boolean }[] = [
  { id: "crosshair", labelKey: "tradeToolCrosshair", ready: true },
  { id: "trend", labelKey: "tradeToolTrend", ready: false },
  { id: "horiz", labelKey: "tradeToolHoriz", ready: false },
  { id: "fib", labelKey: "tradeToolFib", ready: false },
  { id: "text", labelKey: "tradeToolText", ready: false },
  { id: "measure", labelKey: "tradeToolMeasure", ready: false },
];

interface CandlestickChartProps {
  symbol: string;
  interval?: Interval;
  onIntervalChange?: (interval: Interval) => void;
}

export interface CandlestickChartHandle {
  updateKline: (kline: Kline) => void;
}

function klineToCandle(k: Kline): CandlestickData<Time> {
  return {
    time: (k.open_time / 1000) as UTCTimestamp,
    open: Number(k.open),
    high: Number(k.high),
    low: Number(k.low),
    close: Number(k.close),
  };
}

function klineToVolume(k: Kline): HistogramData<Time> {
  const bullish = Number(k.close) >= Number(k.open);
  return {
    time: (k.open_time / 1000) as UTCTimestamp,
    value: Number(k.volume),
    color: bullish ? "rgba(38,166,154,0.5)" : "rgba(239,83,80,0.5)",
  };
}

async function fetchKlines(
  symbol: string,
  interval: string,
  limit = 500,
): Promise<Kline[]> {
  const url = `${GATEWAY_URL}/market/klines/${symbol}?interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch klines: ${res.status}`);
  }
  const data = await res.json();
  return data.klines ?? data;
}

const CandlestickChart = forwardRef<
  CandlestickChartHandle,
  CandlestickChartProps
>(function CandlestickChart({ symbol, interval: controlledInterval, onIntervalChange }, ref) {
  const { t } = useLanguage();
  const [internalInterval, setInternalInterval] = useState<Interval>("1m");
  const interval = controlledInterval ?? internalInterval;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ChartTool>("crosshair");
  const [toolNote, setToolNote] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    updateKline(kline: Kline) {
      if (kline.symbol !== symbol || kline.interval !== interval) return;
      candleSeriesRef.current?.update(klineToCandle(kline));
      volumeSeriesRef.current?.update(klineToVolume(kline));
    },
  }), [symbol, interval]);

  const handleIntervalChange = useCallback((next: Interval) => {
    if (onIntervalChange) {
      onIntervalChange(next);
    } else {
      setInternalInterval(next);
    }
  }, [onIntervalChange]);

  function selectTool(next: ChartTool, ready: boolean, labelKey: MessageKey) {
    setTool(next);
    if (!ready) {
      setToolNote(t("tradeToolComingNext", { label: t(labelKey) }));
      return;
    }
    setToolNote(null);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      width: Math.max(1, container.clientWidth || 400),
      height: Math.max(1, container.clientHeight || 300),
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "var(--text-muted)",
        fontFamily: "'Archivo Variable', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.04)" },
        horzLines: { color: "rgba(0,0,0,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.32 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: false },
    });
    chartRef.current = chart;
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    candleSeriesRef.current = candleSeries;
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.applyOptions({ width, height });
        }
      }
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchKlines(symbol, interval)
      .then((klines) => {
        if (cancelled) return;
        const candles = klines.map(klineToCandle);
        const volumes = klines.map(klineToVolume);
        candleSeriesRef.current?.setData(candles);
        volumeSeriesRef.current?.setData(volumes);
        chartRef.current?.timeScale().fitContent();
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[CandlestickChart] fetch failed:", err);
        setError(t("tradeFailedLoadChart"));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [symbol, interval, t]);

  return (
    <div data-tour="chart" className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-0.5 border-b border-[var(--card-border)] px-1 py-1">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            type="button"
            onClick={() => handleIntervalChange(iv)}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              iv === interval
                ? "bg-black/[0.08] text-[var(--text-primary)]"
                : "bg-transparent text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
            }`}
          >
            {INTERVAL_LABEL[iv]}
          </button>
        ))}
      </div>
      {toolNote && (
        <p className="shrink-0 px-2 py-1 text-[11px] text-[var(--text-muted)]">
          {toolNote}
        </p>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          role="toolbar"
          aria-label={t("tradeChartTools")}
          className="flex w-7 shrink-0 flex-col items-center gap-0.5 border-e border-[var(--card-border)] py-1"
        >
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={t(item.labelKey)}
              aria-label={t(item.labelKey)}
              aria-pressed={tool === item.id}
              onClick={() => selectTool(item.id, item.ready, item.labelKey)}
              className={`rail-icon flex h-6 w-6 items-center justify-center rounded ${
                tool === item.id
                  ? "bg-black/[0.08] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
              }`}
            >
              <ToolIcon id={item.id} />
            </button>
          ))}
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div ref={containerRef} className="absolute inset-0 overflow-hidden" />
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card-bg)]/70">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("tradeLoadingChart", { symbol, interval })}
              </div>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card-bg)]/80">
              <div className="space-y-3 text-center">
                <p className="text-sm text-[var(--text-muted)]">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchKlines(symbol, interval)
                      .then((klines) => {
                        candleSeriesRef.current?.setData(klines.map(klineToCandle));
                        volumeSeriesRef.current?.setData(klines.map(klineToVolume));
                        chartRef.current?.timeScale().fitContent();
                        setLoading(false);
                      })
                      .catch(() => {
                        setError(t("tradeFetchFailed"));
                        setLoading(false);
                      });
                  }}
                  className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-soft)]"
                >
                  {t("retry")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function ToolIcon({ id }: { id: ChartTool }) {
  const cls = "h-4 w-4";
  if (id === "crosshair") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M11.4 3.4h1.2v7h7v1.2h-7v7h-1.2v-7h-7V10.4h7z" className="fill-current" />
      </svg>
    );
  }
  if (id === "trend") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M4.2 17.8 17.1 4.9l.85.85L5.05 18.65z" className="fill-current" />
        <path d="M16.2 5.1h3.7v3.7h-1.2V6.3H16.2z" className="fill-current" />
      </svg>
    );
  }
  if (id === "horiz") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M3.4 11.4h17.2v1.2H3.4z" className="fill-current" />
      </svg>
    );
  }
  if (id === "fib") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M4 6.4h16v1.2H4zm0 5h16v1.2H4zm0 5h16v1.2H4z" className="fill-current" />
      </svg>
    );
  }
  if (id === "text") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M6.4 5.4h11.2v1.4H13v11.8h-2V6.8H6.4z" className="fill-current" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
      <path d="M5.2 17.3 16.6 5.9l.85.85L6.05 18.15zM4.4 18.8h4.2v1.2H4.4z" className="fill-current" />
    </svg>
  );
}

export default CandlestickChart;
