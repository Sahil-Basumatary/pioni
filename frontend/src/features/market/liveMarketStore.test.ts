import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLiveTrade,
  publishLiveTrade,
  resetLiveMarketStore,
  subscribeLiveMarket,
} from "./liveMarketStore";
import type { Trade } from "../../types/market";

const trade: Trade = {
  symbol: "BTCUSDT",
  exchange: "binance",
  price: "50000",
  quantity: "0.5",
  timestamp: 1_700_000_000,
  buyer_maker: false,
};

const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

afterEach(() => {
  resetLiveMarketStore();
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
  vi.unstubAllEnvs();
});

describe("liveMarketStore", () => {
  it("makes the latest trade available immediately", () => {
    window.requestAnimationFrame = () => 1;

    publishLiveTrade(trade);

    expect(getLiveTrade("BTCUSDT")).toEqual(trade);
  });

  it("notifies subscribers on the next animation frame", () => {
    const listener = vi.fn();
    let pendingFrame: FrameRequestCallback | undefined;
    window.requestAnimationFrame = (callback) => {
      pendingFrame = callback;
      return 1;
    };

    subscribeLiveMarket(listener);
    publishLiveTrade(trade);

    expect(listener).not.toHaveBeenCalled();
    pendingFrame?.(performance.now());
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
