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

export const portfolioApi = createApi({
  reducerPath: "portfolioApi",
  baseQuery: gatewayBaseQuery(),
  endpoints: (builder) => ({
    getMyPortfolio: builder.query<Portfolio, void>({
      query: () => "/me/portfolio",
    }),
  }),
});

export const { useGetMyPortfolioQuery } = portfolioApi;
