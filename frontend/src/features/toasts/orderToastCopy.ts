import type { Order } from "../orders/ordersApi";
import type { MessageKey } from "../i18n/translate";
import type { PushToastInput } from "./toastSlice";

export type OrderStatusUpdate = {
  order_id: string;
  portfolio_id?: string;
  symbol: string;
  side?: "BUY" | "SELL" | null;
  status: string;
  filled_quantity?: string;
  average_fill_price?: string | null;
};

type TranslateFn = (
  key: MessageKey,
  vars?: Record<string, string>,
) => string;

function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
}

function pastVerb(
  t: TranslateFn,
  side: "BUY" | "SELL" | null | undefined,
): string {
  if (side === "SELL") return t("tradeVerbSold");
  if (side === "BUY") return t("tradeVerbBought");
  return t("tradeVerbFilled");
}

export function toastFromOrder(
  order: Order,
  t: TranslateFn,
): PushToastInput {
  return toastFromOrderUpdate(
    {
      order_id: order.id,
      symbol: order.symbol,
      side: order.side,
      status: order.status,
      filled_quantity: order.filled_quantity,
      average_fill_price: order.average_fill_price,
    },
    t,
  );
}

export function toastFromOrderUpdate(
  update: OrderStatusUpdate,
  t: TranslateFn,
): PushToastInput {
  const asset = baseAsset(update.symbol);
  const qty = update.filled_quantity || "0";
  const status = update.status.toUpperCase();
  const dedupeKey = `${update.order_id}:${status}`;
  const verb = pastVerb(t, update.side);

  if (status === "FILLED") {
    return {
      title: t("tradeFilledFeedback", { verb, qty, asset }),
      tone: "positive",
      dedupeKey,
    };
  }
  if (status === "PARTIALLY_FILLED") {
    return {
      title: t("tradePartiallyFilledFeedback", { verb, qty, asset }),
      tone: "positive",
      dedupeKey,
    };
  }
  if (status === "CANCELLED" || status === "CANCELED") {
    return {
      title: t("tradeOrderCanceled"),
      tone: "neutral",
      dedupeKey,
    };
  }
  if (status === "REJECTED") {
    return {
      title: t("tradeOrderRejected"),
      tone: "negative",
      dedupeKey,
    };
  }
  return {
    title: t("tradeOrderPlacedFeedback", {
      status: status.toLowerCase().replace(/_/g, " "),
    }),
    tone: "neutral",
    dedupeKey,
  };
}
