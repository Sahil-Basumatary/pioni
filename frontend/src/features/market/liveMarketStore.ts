import { useSyncExternalStore } from "react";
import type { Trade } from "../../types/market";
import { recordTradeStoreMeasurement } from "./marketLatency";

type Listener = () => void;

const latestTradeBySymbol = new Map<string, Trade>();
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
  recordTradeStoreMeasurement(trade);
  scheduleNotify();
}

export function getLiveTrade(symbol: string): Trade | null {
  return latestTradeBySymbol.get(symbol) ?? null;
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

export function resetLiveMarketStore(): void {
  latestTradeBySymbol.clear();
  listeners.clear();
  if (notifyFrameId) {
    cancelAnimationFrame(notifyFrameId);
    notifyFrameId = 0;
  }
}
