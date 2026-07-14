import { describe, expect, it } from "vitest";
import {
  formatGroupStep,
  groupLevels,
  withCumulativeDepth,
} from "./orderBookMath";

describe("formatGroupStep", () => {
  it("matches reference tick labels", () => {
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
      [
        { price: "100.4", total_quantity: "1" },
        { price: "100.2", total_quantity: "2" },
        { price: "99.9", total_quantity: "3" },
      ],
      1,
      "bid",
    );
    expect(bids).toEqual([
      { price: "100", total_quantity: "3" },
      { price: "99", total_quantity: "3" },
    ]);
    const asks = groupLevels(
      [
        { price: "100.1", total_quantity: "1" },
        { price: "100.9", total_quantity: "2" },
        { price: "101.2", total_quantity: "4" },
      ],
      1,
      "ask",
    );
    expect(asks).toEqual([
      { price: "101", total_quantity: "3" },
      { price: "102", total_quantity: "4" },
    ]);
  });
});

describe("withCumulativeDepth", () => {
  it("grows from mid for bids and from far end for reversed asks", () => {
    const bids = withCumulativeDepth(
      [
        { price: "99", total_quantity: "1" },
        { price: "98", total_quantity: "1" },
        { price: "97", total_quantity: "2" },
      ],
      true,
    );
    expect(bids.map((l) => l.depthPct)).toEqual([25, 50, 100]);
    expect(bids.map((l) => l.cumQty)).toEqual([1, 2, 4]);
    const asksHighToLow = withCumulativeDepth(
      [
        { price: "103", total_quantity: "2" },
        { price: "102", total_quantity: "1" },
        { price: "101", total_quantity: "1" },
      ],
      false,
    );
    expect(asksHighToLow.map((l) => l.depthPct)).toEqual([100, 50, 25]);
    expect(asksHighToLow.map((l) => l.cumQty)).toEqual([4, 2, 1]);
  });
});
