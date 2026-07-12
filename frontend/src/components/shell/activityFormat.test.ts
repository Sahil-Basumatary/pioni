import { describe, it, expect } from "vitest";
import {
  formatActivityClock,
  formatActivityDate,
  formatActivityTime,
  formatTradeDetail,
  formatTradeHeadline,
  tradeDetailParts,
} from "./activityFormat";

describe("activityFormat", () => {
  it("uses Order filled as the activity headline", () => {
    expect(formatTradeHeadline("BUY", "BTCUSDT")).toBe("Order filled");
    expect(formatTradeHeadline("SELL", "ETHUSDT")).toBe("Order filled");
  });

  it("formats a readable trade detail line", () => {
    expect(formatTradeDetail("BUY", "0.02", "63500.5", "BTCUSDT")).toBe(
      "Buy 0.02 BTC @ 63,500.5USDT",
    );
  });

  it("splits detail parts for styled rendering", () => {
    expect(tradeDetailParts("SELL", "1.5", "3200", "ETHUSDT")).toEqual({
      sideLabel: "Sell",
      quantity: "1.5",
      asset: "ETH",
      price: "3,200",
      quote: "USDT",
    });
  });

  it("formats stacked activity date and clock", () => {
    const iso = "2026-06-05T15:02:00.000Z";
    expect(formatActivityDate(iso)).toMatch(/\d+\/\d+\/\d+/);
    expect(formatActivityClock(iso)).toMatch(/\d+:\d+/);
    expect(formatActivityTime(iso)).not.toBe("—");
  });
});
