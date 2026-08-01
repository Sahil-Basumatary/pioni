import { describe, it, expect } from "vitest";
import { evaluateOrder } from "./orderValidation";

const base = {
  side: "BUY" as const,
  orderType: "MARKET" as const,
  quantity: "1",
  limitPrice: "",
  livePrice: 100,
  cashBalance: 1000,
};

describe("evaluateOrder", () => {
  it("prices a market order at the live price", () => {
    const result = evaluateOrder({ ...base, quantity: "2" });
    expect(result.effectivePrice).toBe(100);
    expect(result.estimatedTotal).toBe(200);
    expect(result.canSubmit).toBe(true);
  });

  it("prices a limit order at the entered limit price", () => {
    const result = evaluateOrder({
      ...base,
      orderType: "LIMIT",
      limitPrice: "50",
      quantity: "3",
    });
    expect(result.effectivePrice).toBe(50);
    expect(result.estimatedTotal).toBe(150);
    expect(result.canSubmit).toBe(true);
  });

  it("blocks a buy that exceeds the cash balance", () => {
    const result = evaluateOrder({ ...base, quantity: "20" });
    expect(result.canSubmit).toBe(false);
    expect(result.reasonKey).toBe("tradeNotEnoughBalance");
  });

  it("does not apply the balance ceiling to sells", () => {
    const result = evaluateOrder({ ...base, side: "SELL", quantity: "20" });
    expect(result.canSubmit).toBe(true);
  });

  it("requires a positive quantity", () => {
    expect(evaluateOrder({ ...base, quantity: "0" }).reasonKey).toBe(
      "tradeEnterQuantity",
    );
    expect(evaluateOrder({ ...base, quantity: "" }).reasonKey).toBe(
      "tradeEnterQuantity",
    );
  });

  it("requires a limit price for limit orders", () => {
    const result = evaluateOrder({ ...base, orderType: "LIMIT", limitPrice: "" });
    expect(result.canSubmit).toBe(false);
    expect(result.reasonKey).toBe("tradeEnterLimitPrice");
  });

  it("accepts comma-formatted limit prices", () => {
    const result = evaluateOrder({
      ...base,
      orderType: "LIMIT",
      limitPrice: "65,060",
      quantity: "0.01",
    });
    expect(result.canSubmit).toBe(true);
    expect(result.effectivePrice).toBe(65060);
  });

  it("waits for a live price on a market order when none is available", () => {
    const result = evaluateOrder({ ...base, livePrice: null });
    expect(result.canSubmit).toBe(false);
    expect(result.reasonKey).toBe("tradeWaitingLivePrice");
  });

  it("blocks quantity above the numeric ceiling", () => {
    const result = evaluateOrder({
      ...base,
      quantity: "1000000000000",
      cashBalance: null,
    });
    expect(result.canSubmit).toBe(false);
    expect(result.reasonKey).toBe("tradeOrderTooLarge");
  });

  it("blocks notional above the numeric ceiling", () => {
    const result = evaluateOrder({
      ...base,
      orderType: "LIMIT",
      quantity: "1000000000",
      limitPrice: "1000000000",
      cashBalance: null,
    });
    expect(result.canSubmit).toBe(false);
    expect(result.reasonKey).toBe("tradeOrderTooLarge");
  });
});
