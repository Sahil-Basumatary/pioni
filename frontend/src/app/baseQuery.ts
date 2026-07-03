import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../features/auth/token";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

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
