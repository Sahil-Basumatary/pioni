const KEY = "pioni.notificationPrefs";

export type NotifyMode = "all" | "important" | "custom" | "mute";

export type NotificationPrefs = {
  mode: NotifyMode;
  toastPopups: boolean;
  fills: boolean;
  partialFills: boolean;
  cancellations: boolean;
  rejections: boolean;
  placements: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  mode: "all",
  toastPopups: true,
  fills: true,
  partialFills: true,
  cancellations: true,
  rejections: true,
  placements: true,
};

export const NOTIFY_MODE_OPTIONS: { value: NotifyMode; label: string }[] = [
  { value: "all", label: "All trading updates" },
  { value: "important", label: "Important only" },
  { value: "custom", label: "Custom" },
  { value: "mute", label: "Mute" },
];

function isMode(value: unknown): value is NotifyMode {
  return (
    value === "all" ||
    value === "important" ||
    value === "custom" ||
    value === "mute"
  );
}

export function readNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      mode: isMode(parsed.mode) ? parsed.mode : DEFAULT_NOTIFICATION_PREFS.mode,
      toastPopups:
        parsed.toastPopups == null
          ? true
          : Boolean(parsed.toastPopups),
      fills: parsed.fills == null ? true : Boolean(parsed.fills),
      partialFills:
        parsed.partialFills == null ? true : Boolean(parsed.partialFills),
      cancellations:
        parsed.cancellations == null ? true : Boolean(parsed.cancellations),
      rejections:
        parsed.rejections == null ? true : Boolean(parsed.rejections),
      placements:
        parsed.placements == null ? true : Boolean(parsed.placements),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function writeNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export type OrderToastKind =
  | "fill"
  | "partial"
  | "cancel"
  | "reject"
  | "placement";

export function orderToastKind(status: string): OrderToastKind {
  const s = status.toUpperCase();
  if (s === "FILLED") return "fill";
  if (s === "PARTIALLY_FILLED") return "partial";
  if (s === "CANCELLED" || s === "CANCELED") return "cancel";
  if (s === "REJECTED") return "reject";
  return "placement";
}

export function shouldShowOrderToast(
  status: string,
  prefs: NotificationPrefs = readNotificationPrefs(),
): boolean {
  if (!prefs.toastPopups || prefs.mode === "mute") return false;
  const kind = orderToastKind(status);
  if (prefs.mode === "all") return true;
  if (prefs.mode === "important") {
    return kind === "fill" || kind === "partial" || kind === "reject";
  }
  switch (kind) {
    case "fill":
      return prefs.fills;
    case "partial":
      return prefs.partialFills;
    case "cancel":
      return prefs.cancellations;
    case "reject":
      return prefs.rejections;
    default:
      return prefs.placements;
  }
}
