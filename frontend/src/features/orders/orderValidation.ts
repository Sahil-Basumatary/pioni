import type { OrderSide, OrderType } from "./ordersApi";
import type { TradeShellMessageKey } from "../i18n/shellTradeCatalog";

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
