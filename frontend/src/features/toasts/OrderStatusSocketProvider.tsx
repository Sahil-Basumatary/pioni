import { useEffect, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MARKET_WS_URL } from "../../endpoints";
import { useAppDispatch } from "../../app/hooks";
import { useGetMyPortfolioQuery } from "../portfolio/portfolioApi";
import { ordersApi } from "../orders/ordersApi";
import { portfolioApi } from "../portfolio/portfolioApi";
import { pushToast } from "./toastSlice";
import { toastFromOrderUpdate, type OrderStatusUpdate } from "./orderToastCopy";
import { maybeNotifyBrowserPush } from "../settings/browserPush";
import { shouldShowOrderToast } from "../settings/notificationPrefs";
import {
  setWatchedStatus,
  watchedOrderIds,
  watchedStatus,
} from "./orderWatch";
import { useLanguage } from "../auth/LanguageProvider";

const POLL_MS = 2500;

function ordersWsUrl(): string {
  if (import.meta.env.VITE_ORDERS_WS_URL) return import.meta.env.VITE_ORDERS_WS_URL;
  return MARKET_WS_URL.replace(/\/ws\/market(?:\?.*)?$/, "/ws/orders");
}

function parseUpdate(raw: unknown): OrderStatusUpdate | null {
  if (!raw || typeof raw !== "object") return null;
  const msg = raw as Record<string, unknown>;
  const data =
    msg.type === "order_update" && msg.data && typeof msg.data === "object"
      ? (msg.data as Record<string, unknown>)
      : msg;
  if (typeof data.order_id !== "string" || typeof data.symbol !== "string") {
    return null;
  }
  if (typeof data.status !== "string") return null;
  return {
    order_id: data.order_id,
    portfolio_id:
      typeof data.portfolio_id === "string" ? data.portfolio_id : undefined,
    symbol: data.symbol,
    side: data.side === "BUY" || data.side === "SELL" ? data.side : null,
    status: data.status,
    filled_quantity:
      typeof data.filled_quantity === "string" ? data.filled_quantity : undefined,
    average_fill_price:
      typeof data.average_fill_price === "string" || data.average_fill_price === null
        ? (data.average_fill_price as string | null)
        : undefined,
  };
}

export default function OrderStatusSocketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const { data: portfolio } = useGetMyPortfolioQuery(undefined, {
    skip: !isSignedIn,
  });

  useEffect(() => {
    if (!isSignedIn || !portfolio?.id) return;

    const seen = new Set<string>();
    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let delay = 1000;

    const emit = (update: OrderStatusUpdate) => {
      const key = `${update.order_id}:${update.status.toUpperCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (seen.size > 200) {
        const keep = [...seen].slice(-100);
        seen.clear();
        for (const k of keep) seen.add(k);
      }
      setWatchedStatus(update.order_id, update.status);
      if (shouldShowOrderToast(update.status)) {
        dispatch(pushToast(toastFromOrderUpdate(update, t)));
      }
      maybeNotifyBrowserPush(update, t);
      dispatch(
        portfolioApi.util.invalidateTags([
          "Portfolio",
          "Trades",
          "Summary",
          "PnlChart",
        ]),
      );
      dispatch(ordersApi.util.invalidateTags(["Orders", "OrderBook"]));
    };

    const connect = () => {
      if (closed) return;
      ws = new WebSocket(ordersWsUrl());
      ws.onopen = () => {
        delay = 1000;
        ws?.send(
          JSON.stringify({
            action: "subscribe",
            portfolio_ids: [portfolio.id],
          }),
        );
      };
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data));
          const update = parseUpdate(parsed);
          if (update) emit(update);
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        ws = null;
        if (closed) return;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, delay);
        delay = Math.min(delay * 2, 30_000);
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    pollTimer = setInterval(() => {
      if (!watchedOrderIds().length) return;
      void dispatch(
        ordersApi.endpoints.listOrders.initiate(
          { limit: 50 },
          { forceRefetch: true },
        ),
      )
        .unwrap()
        .then((orders) => {
          for (const order of orders) {
            const prev = watchedStatus(order.id);
            if (!prev) continue;
            if (prev === order.status.toUpperCase()) continue;
            emit({
              order_id: order.id,
              symbol: order.symbol,
              side: order.side,
              status: order.status,
              filled_quantity: order.filled_quantity,
              average_fill_price: order.average_fill_price,
            });
          }
        })
        .catch(() => {
          /* best-effort */
        });
    }, POLL_MS);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      ws?.close();
    };
  }, [dispatch, isSignedIn, portfolio?.id, t]);

  return children;
}
