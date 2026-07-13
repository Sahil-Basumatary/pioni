import { useCallback, useEffect, useRef } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
  type Interval,
} from "../components/trading/CandlestickChart";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  intervalChanged,
  selectInterval,
  selectSymbol,
} from "../features/instrument/instrumentSlice";
import { selectMarketStatus } from "../features/market/marketSlice";
import {
  STATUS_BAR_SYMBOLS,
  useMarketSocket,
} from "../features/market/MarketSocketProvider";
import OrderTicket from "../features/orders/OrderTicket";
import PairHeader from "../features/trading/PairHeader";
import OrderBookPanel from "../features/trading/OrderBookPanel";
import TradingBottomPanel from "../features/trading/TradingBottomPanel";
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

  useEffect(() => {
    return registerKlineHandler(handleKline);
  }, [registerKlineHandler, handleKline]);

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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <PairHeader symbol={symbol} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row">
        <div className="min-h-[320px] w-full shrink-0 overflow-hidden md:min-h-0 md:w-[280px]">
          <OrderTicket />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row">
            <div className="min-h-[280px] w-full shrink-0 overflow-hidden md:min-h-0 md:w-[280px]">
              <OrderBookPanel symbol={symbol} />
            </div>
            <div className="flex min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 md:min-h-0">
              <CandlestickChart
                ref={chartRef}
                symbol={symbol}
                interval={interval}
                onIntervalChange={handleIntervalChange}
              />
            </div>
          </div>
          <div className="h-[180px] shrink-0 overflow-hidden">
            <TradingBottomPanel symbol={symbol} />
          </div>
        </div>
      </div>
    </div>
  );
}
