import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { TickerSnapshot } from "../../types/market";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

export type PriceMap = Record<string, TickerSnapshot>;

export const marketApi = createApi({
  reducerPath: "marketApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${GATEWAY_URL}/market` }),
  endpoints: (builder) => ({
    getPrices: builder.query<PriceMap, void>({
      query: () => "/prices",
    }),
  }),
});

export const { useGetPricesQuery } = marketApi;
