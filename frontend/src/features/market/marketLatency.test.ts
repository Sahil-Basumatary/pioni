import { afterEach, describe, expect, it, vi } from "vitest";
import {
  markTradeBrowserReceived,
  recordTradeStoreMeasurement,
  recordTradeStateMeasurement,
  scheduleTradePaintMeasurement,
} from "./marketLatency";
import type { Trade } from "../../types/market";

const trade: Trade = {
  symbol: "BTCUSDT",
  exchange: "benchmark",
  price: "50000.00",
  quantity: "0.001",
  timestamp: 1_700_000_000_000,
  buyer_maker: false,
  latency: {
    exchange_at_ms: 1_700_000_000_000,
    market_published_at_ms: 1_700_000_000_010,
    gateway_received_at_ms: 1_700_000_000_012,
    gateway_sent_at_ms: 1_700_000_000_013,
  },
};

const originalRequestAnimationFrame = window.requestAnimationFrame;

afterEach(() => {
  window.__pioniMarketLatency?.reset();
  delete window.__pioniMarketLatency;
  window.requestAnimationFrame = originalRequestAnimationFrame;
  vi.unstubAllEnvs();
});

describe("market latency collector", () => {
  it("does not allocate metadata when debug timing is disabled", () => {
    vi.stubEnv("VITE_MARKET_LATENCY_DEBUG", "false");

    expect(markTradeBrowserReceived(trade)).toBe(trade);
    expect(window.__pioniMarketLatency).toBeUndefined();
  });

  it("records a browser receive-to-paint sample when enabled", () => {
    vi.stubEnv("VITE_MARKET_LATENCY_DEBUG", "true");
    window.requestAnimationFrame = (callback) => {
      callback(performance.now());
      return 1;
    };

    const marked = markTradeBrowserReceived(trade);
    scheduleTradePaintMeasurement(marked);

    expect(marked).not.toBe(trade);
    expect(window.__pioniMarketLatency?.samples).toHaveLength(1);
    expect(window.__pioniMarketLatency?.latestSummary?.samples).toBe(1);
  });

  it("records a browser receive-to-state sample when enabled", () => {
    vi.stubEnv("VITE_MARKET_LATENCY_DEBUG", "true");

    const marked = markTradeBrowserReceived(trade);
    recordTradeStateMeasurement([marked]);

    expect(window.__pioniMarketLatency?.stateSamples).toHaveLength(1);
    expect(window.__pioniMarketLatency?.latestStateSummary?.samples).toBe(1);
  });

  it("records a browser receive-to-store sample when enabled", () => {
    vi.stubEnv("VITE_MARKET_LATENCY_DEBUG", "true");

    const marked = markTradeBrowserReceived(trade);
    recordTradeStoreMeasurement(marked);

    expect(window.__pioniMarketLatency?.storeSamples).toHaveLength(1);
    expect(window.__pioniMarketLatency?.latestStoreSummary?.samples).toBe(1);
  });
});
