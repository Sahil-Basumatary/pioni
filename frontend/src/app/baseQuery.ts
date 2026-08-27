import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../features/auth/token";
import { GATEWAY_URL } from "../endpoints";

export function gatewayBaseQuery(path = "") {
  return fetchBaseQuery({
    baseUrl: `${GATEWAY_URL}${path}`,
    prepareHeaders: async (headers) => {
      const token = await getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  });
}
