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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <PairHeader symbol={symbol} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
        <div className="flex min-h-[360px] w-full shrink-0 flex-col md:w-[260px] xl:w-[300px]">
          <OrderTicket />
        </div>
        <div className="flex min-h-[320px] w-full shrink-0 flex-col md:w-[220px] xl:w-[260px]">
          <OrderBookPanel symbol={symbol} />
        </div>
        <div className="card-premium flex min-h-[320px] min-w-0 flex-1 flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 backdrop-blur-xl">
          <CandlestickChart
            ref={chartRef}
            symbol={symbol}
            interval={interval}
            onIntervalChange={handleIntervalChange}
          />
        </div>
      </div>
      <TradingBottomPanel symbol={symbol} />
    </div>
  );
}
