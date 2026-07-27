import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";

export type AlertCondition = "ABOVE" | "BELOW";
export type AlertStatus = "ACTIVE" | "TRIGGERED" | "CANCELLED";
export type AlertsTab = "active" | "history";

export type PriceAlert = {
  id: string;
  symbol: string;
  condition: AlertCondition | string;
  target_price: string;
  status: AlertStatus | string;
  triggered_at: string | null;
  cancelled_at: string | null;
  trigger_price: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePriceAlertBody = {
  symbol: string;
  condition: AlertCondition;
  target_price: string;
};

export const alertsApi = createApi({
  reducerPath: "alertsApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["PriceAlerts"],
  endpoints: (builder) => ({
    listPriceAlerts: builder.query<
      PriceAlert[],
      { tab?: AlertsTab; symbol?: string | null }
    >({
      query: ({ tab = "active", symbol } = {}) => {
        const params = new URLSearchParams({ tab });
        if (symbol) params.set("symbol", symbol);
        return `/me/alerts?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((row) => ({ type: "PriceAlerts" as const, id: row.id })),
              { type: "PriceAlerts", id: "LIST" },
            ]
          : [{ type: "PriceAlerts", id: "LIST" }],
    }),
    createPriceAlert: builder.mutation<PriceAlert, CreatePriceAlertBody>({
      query: (body) => ({
        url: "/me/alerts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PriceAlerts", id: "LIST" }],
    }),
    cancelPriceAlert: builder.mutation<PriceAlert, string>({
      query: (alertId) => ({
        url: `/me/alerts/${alertId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "PriceAlerts", id: "LIST" }],
    }),
    triggerPriceAlert: builder.mutation<
      PriceAlert,
      { alertId: string; price: string }
    >({
      query: ({ alertId, price }) => ({
        url: `/me/alerts/${alertId}/trigger`,
        method: "POST",
        body: { price },
      }),
      invalidatesTags: [{ type: "PriceAlerts", id: "LIST" }],
    }),
  }),
});

export const {
  useListPriceAlertsQuery,
  useCreatePriceAlertMutation,
  useCancelPriceAlertMutation,
  useTriggerPriceAlertMutation,
} = alertsApi;
