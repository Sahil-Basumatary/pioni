import { describe, expect, it } from "vitest";
import { MARKET_CATALOG } from "./catalog";
import { deskPath, resolveDeskSymbol } from "./marketLinks";

describe("deskPath", () => {
  it("carries the pair so the desk opens on the market that was clicked", () => {
    expect(deskPath("BTCUSDT")).toBe("/trading?symbol=BTCUSDT");
  });

  it("encodes the symbol so a synthetic id cannot break out of the query", () => {
    expect(deskPath("BTCUSDT:FF:250731")).toBe("/trading?symbol=BTCUSDT%3AFF%3A250731");
  });
});

describe("resolveDeskSymbol", () => {
  it("accepts a listed pair regardless of case", () => {
    expect(resolveDeskSymbol("btcusdt")).toBe("BTCUSDT");
  });

  it("round-trips every catalog entry", () => {
    for (const market of MARKET_CATALOG) {
      expect(resolveDeskSymbol(market.symbol)).toBe(market.symbol);
    }
  });

  it("rejects anything not in the catalog", () => {
    expect(resolveDeskSymbol("NOTAPAIR")).toBeNull();
    expect(resolveDeskSymbol("BTCUSDT:FF:250731")).toBeNull();
    expect(resolveDeskSymbol("<script>alert(1)</script>")).toBeNull();
    expect(resolveDeskSymbol("")).toBeNull();
    expect(resolveDeskSymbol(null)).toBeNull();
    expect(resolveDeskSymbol(undefined)).toBeNull();
  });
});
