import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  useMarketWebSocket,
  type ConnectionStatus,
} from "../../hooks/useMarketWebSocket";
import { useAppDispatch } from "../../app/hooks";
import { statusChanged, tradesFrameReceived } from "./marketSlice";
import {
  recordTradeStateMeasurement,
  scheduleTradePaintMeasurement,
} from "./marketLatency";
import { publishLiveTrade } from "./liveMarketStore";
import type { Kline, Trade } from "../../types/market";

export const STATUS_BAR_SYMBOLS = ["BTCUSDT", "ETHUSDT"] as const;

type KlineHandler = (kline: Kline, interval: string) => void;

type MarketSocketContextValue = {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  registerKlineHandler: (handler: KlineHandler) => () => void;
};

const MarketSocketContext = createContext<MarketSocketContextValue | null>(null);

export function MarketSocketProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const klineHandlersRef = useRef(new Set<KlineHandler>());
  const tradeBufferRef = useRef<Record<string, Trade>>({});
  const rafIdRef = useRef(0);

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
          if (trades.length === 0) return;
          dispatch(tradesFrameReceived(buffered));
          recordTradeStateMeasurement(trades);
          for (const bufferedTrade of trades) {
            scheduleTradePaintMeasurement(bufferedTrade);
          }
        });
      }
    },
    [dispatch],
  );

  const handleKline = useCallback((kline: Kline, interval: string) => {
    for (const handler of klineHandlersRef.current) {
      handler(kline, interval);
    }
  }, []);

  const handleStatusChange = useCallback(
    (next: ConnectionStatus) => dispatch(statusChanged(next)),
    [dispatch],
  );

  const { status, subscribe, unsubscribe } = useMarketWebSocket({
    onTrade: handleTrade,
    onKline: handleKline,
    onStatusChange: handleStatusChange,
  });

  useEffect(() => {
    if (status !== "connected") return;
    subscribe([...STATUS_BAR_SYMBOLS]);
  }, [status, subscribe]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const registerKlineHandler = useCallback((handler: KlineHandler) => {
    klineHandlersRef.current.add(handler);
    return () => {
      klineHandlersRef.current.delete(handler);
    };
  }, []);

  const value = useMemo(
    () => ({ subscribe, unsubscribe, registerKlineHandler }),
    [subscribe, unsubscribe, registerKlineHandler],
  );

  return (
    <MarketSocketContext.Provider value={value}>
      {children}
    </MarketSocketContext.Provider>
  );
}

export function useMarketSocket(): MarketSocketContextValue {
  const ctx = useContext(MarketSocketContext);
  if (!ctx) {
    throw new Error("useMarketSocket must be used within MarketSocketProvider");
  }
  return ctx;
}
