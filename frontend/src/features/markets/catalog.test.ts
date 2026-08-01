import { describe, expect, it } from "vitest";
import { MARKET_CATALOG, MARKET_SYMBOLS, getMarketMeta } from "./catalog";
import { SYMBOLS } from "../../components/trading/SymbolSelector";

const NEW_PAIRS = [
  "BNBUSDT",
  "UNIUSDT",
  "NEARUSDT",
  "SUIUSDT",
  "OPUSDT",
  "AAVEUSDT",
  "FILUSDT",
  "TRXUSDT",
  "TONUSDT",
  "SEIUSDT",
] as const;

describe("MARKET_CATALOG", () => {
  it("includes the expanded icon-ready pairs", () => {
    for (const symbol of NEW_PAIRS) {
      expect(MARKET_SYMBOLS).toContain(symbol);
      expect(getMarketMeta(symbol)?.label).toBeTruthy();
    }
    expect(MARKET_CATALOG).toHaveLength(31);
  });

  it("keeps SymbolSelector in sync with the catalog", () => {
    expect(SYMBOLS.map((s) => s.symbol)).toEqual(MARKET_SYMBOLS);
  });
});
