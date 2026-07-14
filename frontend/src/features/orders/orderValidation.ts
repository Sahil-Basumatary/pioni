import type { OrderSide, OrderType } from "./ordersApi";

export interface OrderInput {
  side: OrderSide;
  orderType: OrderType;
  quantity: string;
  limitPrice: string;
  livePrice: number | null;
  cashBalance: number | null;
}

export interface OrderEvaluation {
  effectivePrice: number | null;
  estimatedTotal: number | null;
  canSubmit: boolean;
  reason: string | null;
}

// Pure order validation kept out of the component so the buying-power and price rules can be
// unit-tested without rendering. A market order prices at the latest trade; a limit order at the
// user's price. Sell-side position sufficiency is enforced by the backend (the browser has no
// authoritative holdings view yet), so it is intentionally not blocked here.
export function evaluateOrder(input: OrderInput): OrderEvaluation {
  const quantity = Number(input.quantity);
  const effectivePrice =
    input.orderType === "LIMIT" ? Number(input.limitPrice) : input.livePrice;
  const priceValid =
    effectivePrice != null && Number.isFinite(effectivePrice) && effectivePrice > 0;
  const quantityValid = Number.isFinite(quantity) && quantity > 0;
  const estimatedTotal =
    priceValid && quantityValid ? quantity * (effectivePrice as number) : null;
  if (!quantityValid) {
    return {
      effectivePrice: priceValid ? (effectivePrice as number) : null,
      estimatedTotal: null,
      canSubmit: false,
      reason: "Enter a quantity",
    };
  }
  if (!priceValid) {
    return {
      effectivePrice: null,
      estimatedTotal: null,
      canSubmit: false,
      reason: input.orderType === "LIMIT" ? "Enter a limit price" : "Waiting for a live price",
    };
  }
  if (
    input.side === "BUY" &&
    input.cashBalance != null &&
    estimatedTotal != null &&
    estimatedTotal > input.cashBalance
  ) {
    return {
      effectivePrice,
      estimatedTotal,
      canSubmit: false,
      reason: "Not enough balance",
    };
  }
  return { effectivePrice, estimatedTotal, canSubmit: true, reason: null };
}
