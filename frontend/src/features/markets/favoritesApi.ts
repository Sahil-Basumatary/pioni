import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";

export type ServerFavorites = {
  symbols: string[];
};

export type ServerFavoritesPut = {
  symbols: string[];
};

export const favoritesApi = createApi({
  reducerPath: "favoritesApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["MarketFavorites"],
  endpoints: (builder) => ({
    getMyFavorites: builder.query<ServerFavorites, void>({
      query: () => "/me/favorites",
      providesTags: ["MarketFavorites"],
    }),
    putMyFavorites: builder.mutation<ServerFavorites, ServerFavoritesPut>({
      query: (body) => ({
        url: "/me/favorites",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MarketFavorites"],
    }),
  }),
});

export const { useGetMyFavoritesQuery, usePutMyFavoritesMutation } =
  favoritesApi;
