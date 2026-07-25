import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  initial_balance: string;
  cash_balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTrade {
  id: string;
  order_id: string;
  portfolio_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
  fee: string;
  executed_at: string;
}

export interface PortfolioLedgerEntry {
  id: string;
  portfolio_id: string;
  trade_id: string | null;
  entry_type: string;
  wallet: string;
  asset: string;
  ticker: string;
  amount: string;
  fee: string;
  balance_after: string;
  executed_at: string;
}

export interface PortfolioPosition {
  id: string;
  portfolio_id: string;
  symbol: string;
  quantity: string;
  avg_entry_price: string;
  realized_pnl: string;
  market_price: string | null;
  unrealized_pnl: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  positions: PortfolioPosition[];
  total_value: string;
  total_realized_pnl: string;
  total_unrealized_pnl: string | null;
}

export interface PnlChartPoint {
  date: string;
  total_value: string;
  daily_pnl: string;
  cumulative_pnl: string;
}

export const portfolioApi = createApi({
  reducerPath: "portfolioApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["Portfolio", "Trades", "Ledger", "Summary", "PnlChart"],
  endpoints: (builder) => ({
    getMyPortfolio: builder.query<Portfolio, void>({
      query: () => "/me/portfolio",
      providesTags: ["Portfolio"],
    }),
    getMySummary: builder.query<PortfolioSummary, void>({
      query: () => "/me/summary",
      providesTags: ["Summary", "Portfolio"],
    }),
    getMyPnlChart: builder.query<PnlChartPoint[], { days?: number } | void>({
      query: (args) => ({
        url: "/me/pnl-chart",
        params: { days: args?.days ?? 30 },
      }),
      providesTags: ["PnlChart"],
    }),
    getMyTrades: builder.query<
      PortfolioTrade[],
      { limit?: number; symbol?: string } | void
    >({
      query: (args) => ({
        url: "/me/trades",
        params: {
          limit: args?.limit ?? 30,
          ...(args?.symbol ? { symbol: args.symbol } : {}),
        },
      }),
      providesTags: ["Trades"],
    }),
    getMyLedger: builder.query<
      PortfolioLedgerEntry[],
      { limit?: number; ticker?: string } | void
    >({
      query: (args) => ({
        url: "/me/ledger",
        params: {
          limit: args?.limit ?? 100,
          ...(args?.ticker ? { ticker: args.ticker } : {}),
        },
      }),
      providesTags: ["Ledger"],
    }),
    getMyPositions: builder.query<PortfolioPosition[], { openOnly?: boolean } | void>({
      query: (args) => ({
        url: "/me/positions",
        params: { open_only: args?.openOnly ?? true },
      }),
      providesTags: ["Summary"],
    }),
    resetPortfolio: builder.mutation<Portfolio, void>({
      query: () => ({ url: "/me/portfolio/reset", method: "POST" }),
      invalidatesTags: ["Portfolio", "Trades", "Ledger", "Summary", "PnlChart"],
    }),
  }),
});

export const {
  useGetMyPortfolioQuery,
  useGetMySummaryQuery,
  useGetMyPnlChartQuery,
  useGetMyTradesQuery,
  useGetMyLedgerQuery,
  useGetMyPositionsQuery,
  useResetPortfolioMutation,
  useLazyGetMyPortfolioQuery,
  useLazyGetMySummaryQuery,
  useLazyGetMyTradesQuery,
  useLazyGetMyPositionsQuery,
} = portfolioApi;
