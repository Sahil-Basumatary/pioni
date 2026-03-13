import { useCallback, useEffect, useRef, useState } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
} from "../components/trading/CandlestickChart";
import PriceTicker from "../components/trading/PriceTicker";
import {
  useMarketWebSocket,
  type ConnectionStatus,
} from "../hooks/useMarketWebSocket";
import type { Kline, Trade } from "../types/market";

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
  const [latestTrade, setLatestTrade] = useState<Trade | null>(null);
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);

  const handleKline = useCallback((kline: Kline, _interval: string) => {
    chartRef.current?.updateKline(kline);
  }, []);

  const handleTrade = useCallback(
    (trade: Trade) => {
      if (trade.symbol === symbol) setLatestTrade(trade);
    },
    [symbol],
  );

  const { status, subscribe, unsubscribe } = useMarketWebSocket({
    onKline: handleKline,
    onTrade: handleTrade,
  });

  useEffect(() => {
    setLatestTrade(null);
  }, [symbol]);

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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            {symbol}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
            {STATUS_LABELS[status]}
          </div>
        </div>
        <PriceTicker symbol={symbol} trade={latestTrade} />
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
        <CandlestickChart ref={chartRef} symbol={symbol} />
      </div>
    </div>
  );
}
