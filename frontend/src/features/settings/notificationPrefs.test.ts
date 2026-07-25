import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFS,
  orderToastKind,
  readNotificationPrefs,
  shouldNotifyOrderEvent,
  shouldShowBrowserNotification,
  shouldShowOrderToast,
  writeNotificationPrefs,
} from "./notificationPrefs";

describe("notificationPrefs", () => {
  it("round-trips custom mode flags and channels", () => {
    writeNotificationPrefs({
      ...DEFAULT_NOTIFICATION_PREFS,
      mode: "custom",
      fills: true,
      placements: false,
      emailEnabled: true,
      browserNotifications: true,
    });
    expect(readNotificationPrefs().mode).toBe("custom");
    expect(readNotificationPrefs().placements).toBe(false);
    expect(readNotificationPrefs().emailEnabled).toBe(true);
    expect(readNotificationPrefs().browserNotifications).toBe(true);
    writeNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
  });

  it("maps statuses to toast kinds", () => {
    expect(orderToastKind("FILLED")).toBe("fill");
    expect(orderToastKind("PARTIALLY_FILLED")).toBe("partial");
    expect(orderToastKind("CANCELED")).toBe("cancel");
    expect(orderToastKind("REJECTED")).toBe("reject");
    expect(orderToastKind("NEW")).toBe("placement");
  });

  it("gates events by mode independent of channel", () => {
    expect(
      shouldNotifyOrderEvent("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "mute",
      }),
    ).toBe(false);
    expect(
      shouldNotifyOrderEvent("NEW", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "important",
      }),
    ).toBe(false);
    expect(
      shouldNotifyOrderEvent("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "important",
      }),
    ).toBe(true);
  });

  it("gates toasts and browser notifications by channel flags", () => {
    expect(
      shouldShowOrderToast("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        toastPopups: false,
      }),
    ).toBe(false);
    expect(
      shouldShowBrowserNotification("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        browserNotifications: true,
      }),
    ).toBe(true);
    expect(
      shouldShowBrowserNotification("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        browserNotifications: false,
      }),
    ).toBe(false);
  });
});
