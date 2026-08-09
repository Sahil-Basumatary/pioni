import type { OrderSide, OrderType } from "./ordersApi";
import type { TradeShellMessageKey } from "../i18n/shellTradeCatalog";

/* Keep in sync with libs/common/common/numeric_limits.py (NUMERIC 20,8), which
   keeps magnitude under 10^12. Spelling the ceiling out as 999999999999.99999999
   needs more significant digits than a double carries, so it rounds up to 10^12
   and quietly admits orders the database then rejects. Hence the exclusive bound. */
export const ORDER_QUANTITY_LIMIT = 1e12;
export const ORDER_NOTIONAL_LIMIT = 1e12;

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
  reasonKey: TradeShellMessageKey | null;
}

export function evaluateOrder(input: OrderInput): OrderEvaluation {
  const quantity = Number(String(input.quantity).replace(/,/g, ""));
  const limit = Number(String(input.limitPrice).replace(/,/g, ""));
  const effectivePrice =
    input.orderType === "LIMIT" ? limit : input.livePrice;
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
      reasonKey: "tradeEnterQuantity",
    };
  }
  if (quantity >= ORDER_QUANTITY_LIMIT) {
    return {
      effectivePrice: priceValid ? (effectivePrice as number) : null,
      estimatedTotal: null,
      canSubmit: false,
      reasonKey: "tradeOrderTooLarge",
    };
  }
  if (!priceValid) {
    return {
      effectivePrice: null,
      estimatedTotal: null,
      canSubmit: false,
      reasonKey:
        input.orderType === "LIMIT"
          ? "tradeEnterLimitPrice"
          : "tradeWaitingLivePrice",
    };
  }
  if (estimatedTotal != null && estimatedTotal >= ORDER_NOTIONAL_LIMIT) {
    return {
      effectivePrice,
      estimatedTotal,
      canSubmit: false,
      reasonKey: "tradeOrderTooLarge",
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
      reasonKey: "tradeNotEnoughBalance",
    };
  }
  return { effectivePrice, estimatedTotal, canSubmit: true, reasonKey: null };
}
