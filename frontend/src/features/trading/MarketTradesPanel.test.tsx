import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MarketTradesPanel, {
  formatTapeQty,
  tapeSide,
} from "./MarketTradesPanel";
import type { Trade } from "../../types/market";

vi.mock("../market/liveMarketStore", () => ({
  useLiveMarketTrades: () =>
    [
      {
        symbol: "BTCUSDT",
        price: "64003.3",
        quantity: "0.101936",
        timestamp: 1_700_000_000_000,
        exchange: "binance",
        buyer_maker: false,
      },
      {
        symbol: "BTCUSDT",
        price: "64003.2",
        quantity: "0.00001883",
        timestamp: 1_700_000_001_000,
        exchange: "binance",
        buyer_maker: true,
      },
    ] satisfies Trade[],
}));

describe("MarketTradesPanel", () => {
  it("maps aggressor side like the live tape", () => {
    expect(
      tapeSide({
        symbol: "BTCUSDT",
        price: "1",
        quantity: "1",
        timestamp: 1,
        exchange: "binance",
        buyer_maker: false,
      }),
    ).toBe("Buy");
    expect(
      tapeSide({
        symbol: "BTCUSDT",
        price: "1",
        quantity: "1",
        timestamp: 1,
        exchange: "binance",
        buyer_maker: true,
      }),
    ).toBe("Sell");
  });

  it("keeps small quantities at eight decimals", () => {
    expect(formatTapeQty("0.00001883")).toBe("0.00001883");
  });

  it("renders Side Price Quantity Time columns", () => {
    render(<MarketTradesPanel symbol="BTCUSDT" />);
    expect(screen.getByText("Side")).toBeTruthy();
    expect(screen.getByText("Price")).toBeTruthy();
    expect(screen.getByText("Quantity")).toBeTruthy();
    expect(screen.getByText("Time")).toBeTruthy();
    expect(screen.getByText("Buy")).toBeTruthy();
    expect(screen.getByText("Sell")).toBeTruthy();
    expect(screen.getByText("0.00001883")).toBeTruthy();
  });
});
