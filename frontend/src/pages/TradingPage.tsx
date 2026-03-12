import { useCallback, useEffect, useRef, useState } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
} from "../components/trading/CandlestickChart";
import {
  useMarketWebSocket,
  type ConnectionStatus,
} from "../hooks/useMarketWebSocket";
import type { Kline } from "../types/market";

const DEFAULT_SYMBOL = "BTCUSDT";

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-400 animate-pulse",
  disconnected: "bg-red-500",
};
const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Live",
  connecting: "Connecting…",
  disconnected: "Disconnected",
};

export default function TradingPage() {
  const [symbol] = useState(DEFAULT_SYMBOL);
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);

  const handleKline = useCallback((kline: Kline, _interval: string) => {
    chartRef.current?.updateKline(kline);
  }, []);

  const { status, subscribe, unsubscribe } = useMarketWebSocket({
    onKline: handleKline,
  });

  useEffect(() => {
    if (status !== "connected") return;
    const prev = prevSymbolRef.current;
    if (prev && prev !== symbol) {
      unsubscribe([prev]);
    }
    subscribe([symbol]);
    prevSymbolRef.current = symbol;
  }, [symbol, status, subscribe, unsubscribe]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7.5rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            {symbol}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Live market data and candlestick charts.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
          {STATUS_LABELS[status]}
        </div>
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
        <CandlestickChart ref={chartRef} symbol={symbol} />
      </div>
    </div>
  );
}
