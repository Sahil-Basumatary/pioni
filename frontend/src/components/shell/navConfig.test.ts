import { describe, it, expect } from "vitest";
import {
  PRODUCT_NAV,
  groupContainsPath,
  groupDefaultTo,
  isPathActive,
  type NavGroupItem,
} from "./navConfig";

describe("navConfig", () => {
  it("exposes a config-driven product nav with a Trade group", () => {
    const trade = PRODUCT_NAV.find((item) => item.id === "trade");
    expect(trade?.kind).toBe("group");
    if (trade?.kind !== "group") return;
    expect(trade.children.map((child) => child.id)).toEqual([
      "spot",
      "margin",
      "futures",
      "prop",
    ]);
  });

  it("marks nested trade routes as active for the Trade group", () => {
    const trade = PRODUCT_NAV.find((item) => item.id === "trade") as NavGroupItem;
    expect(groupContainsPath(trade, "/trading")).toBe(true);
    expect(groupContainsPath(trade, "/trade/margin")).toBe(true);
    expect(groupContainsPath(trade, "/markets")).toBe(false);
  });

  it("defaults the Trade parent to Spot", () => {
    const trade = PRODUCT_NAV.find((item) => item.id === "trade") as NavGroupItem;
    expect(groupDefaultTo(trade)).toBe("/trading");
  });

  it("matches exact and nested paths", () => {
    expect(isPathActive("/markets", "/markets")).toBe(true);
    expect(isPathActive("/markets/btc", "/markets")).toBe(true);
    expect(isPathActive("/trading", "/markets")).toBe(false);
  });
});
