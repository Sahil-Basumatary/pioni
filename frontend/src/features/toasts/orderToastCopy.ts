import type { Order } from "../orders/ordersApi";
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

function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
}

function verb(side: "BUY" | "SELL" | null | undefined, past: boolean): string {
  if (side === "SELL") return past ? "sold" : "sell";
  if (side === "BUY") return past ? "bought" : "buy";
  return past ? "filled" : "fill";
}

export function toastFromOrder(order: Order): PushToastInput {
  return toastFromOrderUpdate({
    order_id: order.id,
    symbol: order.symbol,
    side: order.side,
    status: order.status,
    filled_quantity: order.filled_quantity,
    average_fill_price: order.average_fill_price,
  });
}

export function toastFromOrderUpdate(update: OrderStatusUpdate): PushToastInput {
  const asset = baseAsset(update.symbol);
  const qty = update.filled_quantity || "0";
  const status = update.status.toUpperCase();
  const dedupeKey = `${update.order_id}:${status}`;

  if (status === "FILLED") {
    return {
      title: `Filled — ${verb(update.side, true)} ${qty} ${asset}`,
      tone: "positive",
      dedupeKey,
    };
  }
  if (status === "PARTIALLY_FILLED") {
    return {
      title: `Partially filled — ${verb(update.side, true)} ${qty} ${asset}`,
      tone: "positive",
      dedupeKey,
    };
  }
  if (status === "CANCELLED" || status === "CANCELED") {
    return {
      title: "Order canceled",
      tone: "neutral",
      dedupeKey,
    };
  }
  if (status === "REJECTED") {
    return {
      title: "Order rejected",
      tone: "negative",
      dedupeKey,
    };
  }
  return {
    title: `Order placed (${status.toLowerCase().replace(/_/g, " ")})`,
    tone: "neutral",
    dedupeKey,
  };
}
