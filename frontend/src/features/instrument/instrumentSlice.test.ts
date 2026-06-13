import { describe, it, expect } from "vitest";
import reducer, {
  intervalChanged,
  symbolSelected,
} from "./instrumentSlice";

const initial = { symbol: "BTCUSDT", interval: "1m" as const };

describe("instrumentSlice", () => {
  it("starts on BTCUSDT / 1m", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initial);
  });

  it("normalises a selected symbol to upper case", () => {
    const state = reducer(initial, symbolSelected("ethusdt"));
    expect(state.symbol).toBe("ETHUSDT");
  });

  it("updates the interval without touching the symbol", () => {
    const state = reducer(initial, intervalChanged("1h"));
    expect(state).toEqual({ symbol: "BTCUSDT", interval: "1h" });
  });
});
