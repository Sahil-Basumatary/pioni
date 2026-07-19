import { describe, expect, it } from "vitest";
import toastReducer, { dismissToast, pushToast } from "./toastSlice";
import { toastFromOrderUpdate } from "./orderToastCopy";

describe("toastSlice", () => {
  it("stacks toasts and caps length", () => {
    let state = toastReducer(undefined, { type: "@@init" });
    for (let i = 0; i < 7; i += 1) {
      state = toastReducer(state, pushToast({ title: `t${i}` }));
    }
    expect(state.items).toHaveLength(5);
    expect(state.items[0]?.title).toBe("t2");
  });

  it("dedupes by key", () => {
    let state = toastReducer(
      undefined,
      pushToast({ title: "a", dedupeKey: "o1:FILLED" }),
    );
    state = toastReducer(
      state,
      pushToast({ title: "b", dedupeKey: "o1:FILLED" }),
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.title).toBe("b");
  });

  it("dismisses by id", () => {
    let state = toastReducer(undefined, pushToast({ title: "x" }));
    const id = state.items[0]!.id;
    state = toastReducer(state, dismissToast(id));
    expect(state.items).toHaveLength(0);
  });
});

describe("orderToastCopy", () => {
  it("formats fills", () => {
    const t = toastFromOrderUpdate({
      order_id: "1",
      symbol: "BTCUSDT",
      side: "BUY",
      status: "FILLED",
      filled_quantity: "0.01",
    });
    expect(t.title).toContain("bought 0.01 BTC");
    expect(t.tone).toBe("positive");
  });
});
