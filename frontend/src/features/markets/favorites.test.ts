import { describe, it, expect, beforeEach } from "vitest";
import { readFavorites, toggleFavorite, writeFavorites } from "./favorites";

describe("favorites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles symbols in and out", () => {
    expect(toggleFavorite("BTCUSDT", [])).toEqual(["BTCUSDT"]);
    expect(toggleFavorite("btcusdt", ["BTCUSDT"])).toEqual([]);
  });

  it("persists favorites", () => {
    writeFavorites(["ETHUSDT"]);
    expect(readFavorites()).toEqual(["ETHUSDT"]);
  });
});
