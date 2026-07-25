import type { OrderStatusUpdate } from "../toasts/orderToastCopy";
import {
  browserNotificationPermission,
  shouldShowBrowserNotification,
} from "./notificationPrefs";

export function maybeNotifyBrowserPush(update: OrderStatusUpdate): void {
  if (!shouldShowBrowserNotification(update.status)) return;
  if (browserNotificationPermission() !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    return;
  }
  try {
    const title = `${update.symbol} · ${update.status.replace(/_/g, " ")}`;
    const body = update.side
      ? `${update.side} order update`
      : "Paper order update";
    const note = new Notification(title, {
      body,
      tag: `pioni-order-${update.order_id}-${update.status}`,
    });
    window.setTimeout(() => note.close(), 6000);
  } catch {
    /* permission revoked mid-flight */
  }
}
