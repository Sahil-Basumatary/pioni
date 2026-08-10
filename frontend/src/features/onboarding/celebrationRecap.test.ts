import { describe, expect, it } from "vitest";
import {
  DEMO_FIRST_TRADE,
  buildFirstTradeRecap,
  pickCelebrationTrade,
} from "./celebrationRecap";
import type { PortfolioTrade } from "../portfolio/portfolioApi";

describe("celebrationRecap", () => {
  it("builds a buy recap with price and positions hint", () => {
    const recap = buildFirstTradeRecap(DEMO_FIRST_TRADE);
    expect(recap.headline).toMatch(/bought 0\.001 BTC/i);
    expect(recap.detail).toMatch(/Positions/i);
    expect(recap.detail).not.toMatch(/not real money/i);
  });

  it("picks the newest trade", () => {
    const older: PortfolioTrade = {
      ...DEMO_FIRST_TRADE,
      id: "old",
      executed_at: "2024-01-01T00:00:00.000Z",
    };
    const newer: PortfolioTrade = {
      ...DEMO_FIRST_TRADE,
      id: "new",
      side: "SELL",
      quantity: "0.02",
      executed_at: "2026-01-01T00:00:00.000Z",
    };
    expect(pickCelebrationTrade([older, newer])?.id).toBe("new");
  });

  it("returns demo trade when forced and empty", () => {
    expect(pickCelebrationTrade([], true)?.id).toBe(DEMO_FIRST_TRADE.id);
    expect(pickCelebrationTrade([], false)).toBeNull();
  });
});
