import type { MessageKey } from "../i18n/translate";
import {
  toastFromOrderUpdate,
  type OrderStatusUpdate,
} from "../toasts/orderToastCopy";
import {
  browserNotificationPermission,
  shouldShowBrowserNotification,
} from "./notificationPrefs";

type TranslateFn = (
  key: MessageKey,
  vars?: Record<string, string>,
) => string;

export function maybeNotifyBrowserPush(
  update: OrderStatusUpdate,
  t: TranslateFn,
): void {
  if (!shouldShowBrowserNotification(update.status)) return;
  if (browserNotificationPermission() !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    return;
  }
  try {
    const toast = toastFromOrderUpdate(update, t);
    const note = new Notification(toast.title, {
      body: update.symbol,
      tag: `pioni-order-${update.order_id}-${update.status}`,
    });
    window.setTimeout(() => note.close(), 6000);
  } catch {
    /* permission revoked mid-flight */
  }
}
