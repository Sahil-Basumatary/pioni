import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";
import type { NotificationPrefs, NotifyMode } from "./notificationPrefs";

export type ServerNotificationPrefs = {
  mode: string;
  toast_popups: boolean;
  email_enabled: boolean;
  browser_notifications: boolean;
  fills: boolean;
  partial_fills: boolean;
  cancellations: boolean;
  rejections: boolean;
  placements: boolean;
};

export type ServerNotificationPrefsPatch = Partial<ServerNotificationPrefs>;

function isMode(value: string): value is NotifyMode {
  return (
    value === "all" ||
    value === "important" ||
    value === "custom" ||
    value === "mute"
  );
}

export function fromServerPrefs(row: ServerNotificationPrefs): NotificationPrefs {
  return {
    mode: isMode(row.mode) ? row.mode : "all",
    toastPopups: row.toast_popups,
    emailEnabled: row.email_enabled,
    browserNotifications: row.browser_notifications,
    fills: row.fills,
    partialFills: row.partial_fills,
    cancellations: row.cancellations,
    rejections: row.rejections,
    placements: row.placements,
  };
}

export function toServerPrefsPatch(
  patch: Partial<NotificationPrefs>,
): ServerNotificationPrefsPatch {
  const out: ServerNotificationPrefsPatch = {};
  if (patch.mode !== undefined) out.mode = patch.mode;
  if (patch.toastPopups !== undefined) out.toast_popups = patch.toastPopups;
  if (patch.emailEnabled !== undefined) out.email_enabled = patch.emailEnabled;
  if (patch.browserNotifications !== undefined) {
    out.browser_notifications = patch.browserNotifications;
  }
  if (patch.fills !== undefined) out.fills = patch.fills;
  if (patch.partialFills !== undefined) out.partial_fills = patch.partialFills;
  if (patch.cancellations !== undefined) out.cancellations = patch.cancellations;
  if (patch.rejections !== undefined) out.rejections = patch.rejections;
  if (patch.placements !== undefined) out.placements = patch.placements;
  return out;
}

export const notificationPrefsApi = createApi({
  reducerPath: "notificationPrefsApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["NotificationPrefs"],
  endpoints: (builder) => ({
    getMyNotificationPrefs: builder.query<ServerNotificationPrefs, void>({
      query: () => "/me/notification-prefs",
      providesTags: ["NotificationPrefs"],
    }),
    patchMyNotificationPrefs: builder.mutation<
      ServerNotificationPrefs,
      ServerNotificationPrefsPatch
    >({
      query: (body) => ({
        url: "/me/notification-prefs",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["NotificationPrefs"],
    }),
  }),
});

export const {
  useGetMyNotificationPrefsQuery,
  usePatchMyNotificationPrefsMutation,
} = notificationPrefsApi;
