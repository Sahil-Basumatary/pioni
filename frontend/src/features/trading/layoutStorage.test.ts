import { describe, it, expect, beforeEach } from "vitest";
import {
  clamp,
  DEFAULT_LAYOUT,
  readTradingLayout,
  writeTradingLayout,
} from "./layoutStorage";

describe("layoutStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clamps values into range", () => {
    expect(clamp(10, 20, 40)).toBe(20);
    expect(clamp(50, 20, 40)).toBe(40);
    expect(clamp(30, 20, 40)).toBe(30);
  });

  it("returns defaults when empty", () => {
    expect(readTradingLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it("round-trips persisted sizes", () => {
    writeTradingLayout({
      ticketWidth: 300,
      bookWidth: 250,
      bottomHeight: 200,
    });
    expect(readTradingLayout()).toEqual({
      ticketWidth: 300,
      bookWidth: 250,
      bottomHeight: 200,
    });
  });

  it("clamps corrupt stored values", () => {
    localStorage.setItem(
      "pioni.tradingLayout.v1",
      JSON.stringify({ ticketWidth: 9999, bookWidth: 10, bottomHeight: -5 }),
    );
    const layout = readTradingLayout();
    expect(layout.ticketWidth).toBe(420);
    expect(layout.bookWidth).toBe(200);
    expect(layout.bottomHeight).toBe(120);
  });
});
