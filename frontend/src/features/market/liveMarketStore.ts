import { useSyncExternalStore } from "react";
import type { Trade } from "../../types/market";
import { recordTradeStoreMeasurement } from "./marketLatency";

type Listener = () => void;

const MAX_RECENT_TRADES = 80;
const latestTradeBySymbol = new Map<string, Trade>();
const recentTradesBySymbol = new Map<string, Trade[]>();
const EMPTY_TRADES: Trade[] = [];
const listeners = new Set<Listener>();
let notifyFrameId = 0;

function scheduleNotify(): void {
  if (notifyFrameId) return;

  notifyFrameId = requestAnimationFrame(() => {
    notifyFrameId = 0;
    for (const listener of listeners) {
      listener();
    }
  });
}

export function publishLiveTrade(trade: Trade): void {
  latestTradeBySymbol.set(trade.symbol, trade);
  const prev = recentTradesBySymbol.get(trade.symbol) ?? EMPTY_TRADES;
  recentTradesBySymbol.set(trade.symbol, [trade, ...prev].slice(0, MAX_RECENT_TRADES));
  recordTradeStoreMeasurement(trade);
  scheduleNotify();
}

export function getLiveTrade(symbol: string): Trade | null {
  return latestTradeBySymbol.get(symbol) ?? null;
}

export function getLiveTrades(symbol: string): Trade[] {
  return recentTradesBySymbol.get(symbol) ?? EMPTY_TRADES;
}

export function subscribeLiveMarket(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLiveMarketTrade(symbol: string): Trade | null {
  return useSyncExternalStore(
    subscribeLiveMarket,
    () => getLiveTrade(symbol),
    () => null,
  );
}

export function useLiveMarketTrades(symbol: string): Trade[] {
  return useSyncExternalStore(
    subscribeLiveMarket,
    () => getLiveTrades(symbol),
    () => EMPTY_TRADES,
  );
}

export function resetLiveMarketStore(): void {
  latestTradeBySymbol.clear();
  recentTradesBySymbol.clear();
  listeners.clear();
  if (notifyFrameId) {
    cancelAnimationFrame(notifyFrameId);
    notifyFrameId = 0;
  }
}
