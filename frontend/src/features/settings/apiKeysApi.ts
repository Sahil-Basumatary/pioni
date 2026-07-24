import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";

export type PaperApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  can_query: boolean;
  can_trade: boolean;
  created_at: string;
  last_used_at: string | null;
};

export type PaperApiKeyCreated = PaperApiKey & {
  api_key: string;
};

export type CreatePaperApiKeyBody = {
  name: string;
  can_query: boolean;
  can_trade: boolean;
};

export const apiKeysApi = createApi({
  reducerPath: "apiKeysApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["ApiKeys"],
  endpoints: (builder) => ({
    getMyApiKeys: builder.query<PaperApiKey[], void>({
      query: () => "/me/api-keys",
      providesTags: ["ApiKeys"],
    }),
    createMyApiKey: builder.mutation<PaperApiKeyCreated, CreatePaperApiKeyBody>({
      query: (body) => ({
        url: "/me/api-keys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApiKeys"],
    }),
    revokeMyApiKey: builder.mutation<PaperApiKey, string>({
      query: (keyId) => ({
        url: `/me/api-keys/${keyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApiKeys"],
    }),
  }),
});

export const {
  useGetMyApiKeysQuery,
  useCreateMyApiKeyMutation,
  useRevokeMyApiKeyMutation,
} = apiKeysApi;
