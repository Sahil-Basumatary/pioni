import { useCallback, useEffect, useRef } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
  type Interval,
} from "../components/trading/CandlestickChart";
import PriceTicker from "../components/trading/PriceTicker";
import SymbolSelector from "../components/trading/SymbolSelector";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  intervalChanged,
  selectInterval,
  selectSymbol,
  symbolSelected,
} from "../features/instrument/instrumentSlice";
import { selectMarketStatus } from "../features/market/marketSlice";
import {
  STATUS_BAR_SYMBOLS,
  useMarketSocket,
} from "../features/market/MarketSocketProvider";
import PortfolioPanel from "../features/portfolio/PortfolioPanel";
import OrderTicket from "../features/orders/OrderTicket";
import type { Kline } from "../types/market";

export default function TradingPage() {
  const dispatch = useAppDispatch();
  const symbol = useAppSelector(selectSymbol);
  const interval = useAppSelector(selectInterval);
  const status = useAppSelector(selectMarketStatus);
  const { subscribe, unsubscribe, registerKlineHandler } = useMarketSocket();
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);

  const handleKline = useCallback(
    (kline: Kline, klineInterval: string) => {
      if (klineInterval !== interval) return;
      chartRef.current?.updateKline(kline);
    },
    [interval],
  );

  useEffect(() => registerKlineHandler(handleKline), [registerKlineHandler, handleKline]);

  const handleSymbolSelect = useCallback(
    (next: string) => dispatch(symbolSelected(next)),
    [dispatch],
  );

  const handleIntervalChange = useCallback(
    (next: Interval) => dispatch(intervalChanged(next)),
    [dispatch],
  );

  useEffect(() => {
    if (status !== "connected") return;
    const prev = prevSymbolRef.current;
    const keep = new Set<string>(STATUS_BAR_SYMBOLS);
    if (prev && prev !== symbol && !keep.has(prev)) {
      unsubscribe([prev]);
    }
    subscribe([symbol]);
    prevSymbolRef.current = symbol;
  }, [symbol, status, subscribe, unsubscribe]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 lg:px-10">
      <div className="flex flex-col gap-2">
        <SymbolSelector selected={symbol} onSelect={handleSymbolSelect} />
        <PriceTicker symbol={symbol} />
        <PortfolioPanel />
      </div>
      <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row">
        <div className="card-premium min-h-0 flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
          <CandlestickChart
            ref={chartRef}
            symbol={symbol}
            interval={interval}
            onIntervalChange={handleIntervalChange}
          />
        </div>
        <div className="shrink-0 lg:w-[320px]">
          <OrderTicket />
        </div>
      </div>
    </div>
  );
}
