import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";
import { portfolioApi } from "../portfolio/portfolioApi";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderTimeInForce = "GTC" | "IOC";

export interface SubmitOrderBody {
  symbol: string;
  side: OrderSide;
  order_type: OrderType;
  time_in_force?: OrderTimeInForce;
  quantity: string;
  price?: string;
}

export interface Order {
  id: string;
  portfolio_id: string;
  symbol: string;
  side: OrderSide;
  order_type: string;
  time_in_force: string;
  status: string;
  quantity: string;
  price: string | null;
  filled_quantity: string;
  average_fill_price: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceLevel {
  price: string;
  total_quantity: string;
  order_count: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  best_bid: string | null;
  best_ask: string | null;
  spread: string | null;
  timestamp: string;
}

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["Orders", "OrderBook"],
  endpoints: (builder) => ({
    submitOrder: builder.mutation<Order, SubmitOrderBody>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "OrderBook"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            portfolioApi.util.invalidateTags([
              "Portfolio",
              "Trades",
              "Summary",
              "PnlChart",
            ]),
          );
        } catch {
          return;
        }
      },
    }),
    listOrders: builder.query<
      Order[],
      { symbol?: string; status?: string; limit?: number } | void
    >({
      query: (args) => ({
        url: "/orders",
        params: {
          limit: args?.limit ?? 50,
          ...(args?.symbol ? { symbol: args.symbol } : {}),
          ...(args?.status ? { status: args.status } : {}),
        },
      }),
      providesTags: ["Orders"],
    }),
    cancelOrder: builder.mutation<{ order_id: string; status: string }, string>({
      query: (orderId) => ({ url: `/orders/${orderId}`, method: "DELETE" }),
      invalidatesTags: ["Orders", "OrderBook"],
    }),
    getOrderBook: builder.query<
      OrderBookSnapshot,
      { symbol: string; depth?: number }
    >({
      query: ({ symbol, depth = 12 }) => ({
        url: `/orderbook/${symbol}`,
        params: { depth },
      }),
      providesTags: ["OrderBook"],
    }),
  }),
});

export const {
  useSubmitOrderMutation,
  useListOrdersQuery,
  useCancelOrderMutation,
  useGetOrderBookQuery,
} = ordersApi;
