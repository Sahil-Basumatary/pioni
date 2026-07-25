import { describe, expect, it } from "vitest";
import {
  formatPrefLimitPrice,
  readDisplayPrefs,
  writeDisplayPrefs,
  DEFAULT_DISPLAY_PREFS,
} from "./displayPrefs";

describe("formatPrefLimitPrice", () => {
  it("uses auto rules by default", () => {
    expect(formatPrefLimitPrice(65146.3, "auto")).toBe("65146.3");
    expect(formatPrefLimitPrice(1.23456, "auto")).toBe("1.2346");
  });

  it("respects fixed decimal prefs", () => {
    expect(formatPrefLimitPrice(65146.321, "2")).toBe("65146.32");
    expect(formatPrefLimitPrice(1.2, "4")).toBe("1.2");
  });
});

describe("displayPrefs trading fields", () => {
  it("defaults new trading fields when missing from storage", () => {
    localStorage.setItem(
      "pioni.displayPrefs",
      JSON.stringify({ confirmOrders: true, startPage: "home" }),
    );
    expect(readDisplayPrefs().defaultOrderType).toBe("LIMIT");
    expect(readDisplayPrefs().priceDecimals).toBe("auto");
    writeDisplayPrefs(DEFAULT_DISPLAY_PREFS);
  });
});
