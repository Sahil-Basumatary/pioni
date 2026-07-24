import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFS,
  orderToastKind,
  readNotificationPrefs,
  shouldShowOrderToast,
  writeNotificationPrefs,
} from "./notificationPrefs";

describe("notificationPrefs", () => {
  it("round-trips custom mode flags", () => {
    writeNotificationPrefs({
      ...DEFAULT_NOTIFICATION_PREFS,
      mode: "custom",
      fills: true,
      placements: false,
    });
    expect(readNotificationPrefs().mode).toBe("custom");
    expect(readNotificationPrefs().placements).toBe(false);
    writeNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
  });

  it("maps statuses to toast kinds", () => {
    expect(orderToastKind("FILLED")).toBe("fill");
    expect(orderToastKind("PARTIALLY_FILLED")).toBe("partial");
    expect(orderToastKind("CANCELED")).toBe("cancel");
    expect(orderToastKind("REJECTED")).toBe("reject");
    expect(orderToastKind("NEW")).toBe("placement");
  });

  it("gates toasts by mode", () => {
    expect(
      shouldShowOrderToast("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "mute",
      }),
    ).toBe(false);
    expect(
      shouldShowOrderToast("NEW", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "important",
      }),
    ).toBe(false);
    expect(
      shouldShowOrderToast("FILLED", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "important",
      }),
    ).toBe(true);
    expect(
      shouldShowOrderToast("NEW", {
        ...DEFAULT_NOTIFICATION_PREFS,
        mode: "custom",
        placements: false,
      }),
    ).toBe(false);
  });
});
