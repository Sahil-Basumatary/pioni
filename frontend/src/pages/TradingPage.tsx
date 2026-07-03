import { useCallback, useEffect, useRef } from "react";
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
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  intervalChanged,
  selectInterval,
  selectSymbol,
  symbolSelected,
} from "../features/instrument/instrumentSlice";
import {
  selectMarketStatus,
  statusChanged,
  tradesFrameReceived,
} from "../features/market/marketSlice";
import {
  recordTradeStateMeasurement,
  scheduleTradePaintMeasurement,
} from "../features/market/marketLatency";
import { publishLiveTrade } from "../features/market/liveMarketStore";
import PortfolioPanel from "../features/portfolio/PortfolioPanel";
import type { Kline, Trade } from "../types/market";

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
  const dispatch = useAppDispatch();
  const symbol = useAppSelector(selectSymbol);
  const interval = useAppSelector(selectInterval);
  const status = useAppSelector(selectMarketStatus);
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);
  const tradeBufferRef = useRef<Record<string, Trade>>({});
  const rafIdRef = useRef(0);

  const handleKline = useCallback(
    (kline: Kline, klineInterval: string) => {
      if (klineInterval !== interval) return;
      chartRef.current?.updateKline(kline);
    },
    [interval],
  );

  // HFTs are coalesced to one dispatch per frame to keep the
  // store from thrashing React subscribers on every tick.
  const handleTrade = useCallback(
    (trade: Trade) => {
      publishLiveTrade(trade);
      tradeBufferRef.current[trade.symbol] = trade;
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = 0;
          const buffered = tradeBufferRef.current;
          tradeBufferRef.current = {};
          const trades = Object.values(buffered);
          if (trades.length > 0) {
            dispatch(tradesFrameReceived(buffered));
            recordTradeStateMeasurement(trades);
            for (const bufferedTrade of trades) {
              scheduleTradePaintMeasurement(bufferedTrade);
            }
          }
        });
      }
    },
    [dispatch],
  );

  const handleStatusChange = useCallback(
    (next: ConnectionStatus) => dispatch(statusChanged(next)),
    [dispatch],
  );

  const handleSymbolSelect = useCallback(
    (next: string) => dispatch(symbolSelected(next)),
    [dispatch],
  );

  const handleIntervalChange = useCallback(
    (next: Interval) => dispatch(intervalChanged(next)),
    [dispatch],
  );

  const { subscribe, unsubscribe } = useMarketWebSocket({
    onKline: handleKline,
    onTrade: handleTrade,
    onStatusChange: handleStatusChange,
  });

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
          <SymbolSelector
            selected={symbol}
            onSelect={handleSymbolSelect}
          />
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
            {STATUS_LABELS[status]}
          </div>
        </div>
        <PriceTicker symbol={symbol} />
        <PortfolioPanel />
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
        <CandlestickChart
          ref={chartRef}
          symbol={symbol}
          interval={interval}
          onIntervalChange={handleIntervalChange}
        />
      </div>
    </div>
  );
}
