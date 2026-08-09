import { describe, expect, it } from "vitest";
import {
  chipLabel,
  featuredRows,
  filterByChip,
  highestActivity,
  topMovers,
  toLiveRows,
} from "./marketingLiveRows";

describe("marketingLiveRows", () => {
  const rows = toLiveRows({
    BTCUSDT: {
      symbol: "BTCUSDT",
      exchange: "binance",
      price: "64000",
      change_24h: null,
      change_pct_24h: 1.2,
      high_24h: null,
      low_24h: null,
      volume_24h: "1000000",
      updated_at: 1,
    },
    ETHUSDT: {
      symbol: "ETHUSDT",
      exchange: "binance",
      price: "3200",
      change_24h: null,
      change_pct_24h: -3.5,
      high_24h: null,
      low_24h: null,
      volume_24h: "500000",
      updated_at: 1,
    },
  });

  it("ranks featured by volume then move size", () => {
    expect(featuredRows(rows, 2).map((r) => r.symbol)).toEqual([
      "BTCUSDT",
      "ETHUSDT",
    ]);
  });

  it("keeps unpriced pairs out of the featured slot", () => {
    expect(featuredRows(rows, 3).every((r) => r.price != null)).toBe(true);
  });

  it("sorts movers by absolute change", () => {
    expect(topMovers(rows, 1)[0]?.symbol).toBe("ETHUSDT");
  });

  it("filters leverage and category chips", () => {
    expect(
      filterByChip(rows, "leverage10").every((r) => (r.marginLeverage ?? 0) >= 10),
    ).toBe(true);
    expect(filterByChip(rows, "Layer 1").every((r) => r.category === "Layer 1")).toBe(true);
    expect(filterByChip(rows, "all")).toHaveLength(rows.length);
  });

  it("ranks activity by volume", () => {
    expect(highestActivity(rows, 1)[0]?.symbol).toBe("BTCUSDT");
  });

  it("labels chips from a single source", () => {
    expect(chipLabel("leverage10")).toBe("10x margin");
    expect(chipLabel("all")).toBe("All markets");
  });
});
