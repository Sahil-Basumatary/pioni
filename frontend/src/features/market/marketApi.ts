import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GATEWAY_URL } from "../../endpoints";
import type { TickerSnapshot } from "../../types/market";

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
