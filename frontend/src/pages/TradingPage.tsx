import { useCallback, useEffect, useRef, useState } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
  type Interval,
} from "../components/trading/CandlestickChart";
import PriceTicker from "../components/trading/PriceTicker";
import SymbolSelector from "../components/trading/SymbolSelector";
import {
  useMarketWebSocket,
  type ConnectionStatus,
} from "../hooks/useMarketWebSocket";
import type { Kline, Trade } from "../types/market";

const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_INTERVAL: Interval = "1m";

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
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [interval, setInterval] = useState<Interval>(DEFAULT_INTERVAL);
  const [latestTrade, setLatestTrade] = useState<Trade | null>(null);
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);
  const tradeBufferRef = useRef<Trade | null>(null);
  const rafIdRef = useRef(0);

  const handleKline = useCallback(
    (kline: Kline, klineInterval: string) => {
      if (klineInterval !== interval) return;
      chartRef.current?.updateKline(kline);
    },
    [interval],
  );

  const handleTrade = useCallback(
    (trade: Trade) => {
      if (trade.symbol !== symbol) return;
      tradeBufferRef.current = trade;
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = 0;
          setLatestTrade(tradeBufferRef.current);
        });
      }
    },
    [symbol],
  );

  const { status, subscribe, unsubscribe } = useMarketWebSocket({
    onKline: handleKline,
    onTrade: handleTrade,
  });

  useEffect(() => {
    setLatestTrade(null);
    tradeBufferRef.current = null;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, [symbol]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <SymbolSelector selected={symbol} onSelect={setSymbol} />
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
            {STATUS_LABELS[status]}
          </div>
        </div>
        <PriceTicker symbol={symbol} trade={latestTrade} />
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
        <CandlestickChart
          ref={chartRef}
          symbol={symbol}
          interval={interval}
          onIntervalChange={setInterval}
        />
      </div>
    </div>
  );
}
