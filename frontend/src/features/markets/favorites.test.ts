import { describe, it, expect, beforeEach } from "vitest";
import {
  mergeFavorites,
  normalizeFavorites,
  readFavorites,
  toggleFavorite,
  writeFavorites,
} from "./favorites";

describe("favorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles symbols in and out", () => {
    expect(toggleFavorite("BTCUSDT", [])).toEqual(["BTCUSDT"]);
    expect(toggleFavorite("btcusdt", ["BTCUSDT"])).toEqual([]);
  });

  it("ignores unknown symbols on toggle", () => {
    expect(toggleFavorite("NOTAREAL", ["BTCUSDT"])).toEqual(["BTCUSDT"]);
  });

  it("normalizes case dedupe and catalog filter", () => {
    expect(
      normalizeFavorites(["btcusdt", "BTCUSDT", "NOPE", 12, "ETHUSDT"]),
    ).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("merges server then local order", () => {
    expect(mergeFavorites(["ETHUSDT"], ["BTCUSDT", "ETHUSDT"])).toEqual([
      "ETHUSDT",
      "BTCUSDT",
    ]);
  });

  it("persists favorites", () => {
    writeFavorites(["ETHUSDT"]);
    expect(readFavorites()).toEqual(["ETHUSDT"]);
  });

  it("drops corrupt storage", () => {
    localStorage.setItem("pioni.marketFavorites", "{not-json");
    expect(readFavorites()).toEqual([]);
  });
});
