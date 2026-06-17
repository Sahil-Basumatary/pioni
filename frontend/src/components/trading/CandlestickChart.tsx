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

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

const DEFAULT_GATEWAY_URL = "http://localhost:8000";

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
  const base = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const url = `${base}/market/klines/${symbol}?interval=${interval}&limit=${limit}`;
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
  const [internalInterval, setInternalInterval] = useState<Interval>("1m");
  const interval = controlledInterval ?? internalInterval;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "var(--text-muted)",
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
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
        chart.applyOptions({ width, height });
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
        setError(err instanceof Error ? err.message : "Failed to load chart data");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [symbol, interval]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-1 pb-3">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => handleIntervalChange(iv)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              iv === interval
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04]"
            }`}
          >
            {iv}
          </button>
        ))}
      </div>
      <div className="relative flex-1 min-h-[360px]">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]/60 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading {symbol} {interval}…
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]/80 backdrop-blur-sm z-10">
            <div className="text-center space-y-3">
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <button
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
                    .catch((err) => {
                      setError(err instanceof Error ? err.message : "Fetch failed");
                      setLoading(false);
                    });
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-soft)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CandlestickChart;
