import { describe, expect, it } from "vitest";
import {
  formatGroupStep,
  groupLevels,
  withCumulativeDepth,
} from "./orderBookMath";

function level(price: string, total_quantity: string, order_count = 1) {
  return { price, total_quantity, order_count };
}

describe("formatGroupStep", () => {
  it("labels sub-unit steps with two decimals and whole steps without", () => {
    expect(formatGroupStep(0.1)).toBe("0.10");
    expect(formatGroupStep(0.5)).toBe("0.50");
    expect(formatGroupStep(1)).toBe("1.0");
    expect(formatGroupStep(2.5)).toBe("2.5");
    expect(formatGroupStep(10)).toBe("10");
  });
});

describe("groupLevels", () => {
  it("buckets bids down and asks up", () => {
    const bids = groupLevels(
      [level("100.4", "1"), level("100.2", "2"), level("99.9", "3")],
      1,
      "bid",
    );
    expect(bids).toEqual([
      { price: "100", total_quantity: "3", order_count: 2 },
      { price: "99", total_quantity: "3", order_count: 1 },
    ]);
    const asks = groupLevels(
      [level("100.1", "1"), level("100.9", "2"), level("101.2", "4")],
      1,
      "ask",
    );
    expect(asks).toEqual([
      { price: "101", total_quantity: "3", order_count: 2 },
      { price: "102", total_quantity: "4", order_count: 1 },
    ]);
  });

  it("sums the order count of every level folded into a bucket", () => {
    const grouped = groupLevels(
      [level("100.4", "1", 3), level("100.2", "2", 5)],
      1,
      "bid",
    );
    expect(grouped).toEqual([
      { price: "100", total_quantity: "3", order_count: 8 },
    ]);
  });
});

describe("withCumulativeDepth", () => {
  it("grows from mid for bids and from far end for reversed asks", () => {
    const bids = withCumulativeDepth(
      [level("99", "1"), level("98", "1"), level("97", "2")],
      true,
    );
    expect(bids.map((level) => level.depthPct)).toEqual([25, 50, 100]);
    expect(bids.map((level) => level.cumQty)).toEqual([1, 2, 4]);
    const asksHighToLow = withCumulativeDepth(
      [level("103", "2"), level("102", "1"), level("101", "1")],
      false,
    );
    expect(asksHighToLow.map((level) => level.depthPct)).toEqual([100, 50, 25]);
    expect(asksHighToLow.map((level) => level.cumQty)).toEqual([4, 2, 1]);
  });
});
