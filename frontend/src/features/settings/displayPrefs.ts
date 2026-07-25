const KEY = "pioni.displayPrefs";

export type StartPageId = "last" | "home" | "trading" | "markets";
export type DefaultOrderType = "LIMIT" | "MARKET";
export type PriceDecimalsPref = "auto" | "2" | "4" | "6" | "8";

export type DisplayPrefs = {
  confirmOrders: boolean;
  showInfoTips: boolean;
  soundOnFill: boolean;
  startPage: StartPageId;
  defaultOrderType: DefaultOrderType;
  priceDecimals: PriceDecimalsPref;
};

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = {
  confirmOrders: false,
  showInfoTips: true,
  soundOnFill: false,
  startPage: "home",
  defaultOrderType: "LIMIT",
  priceDecimals: "auto",
};

export const START_PAGE_OPTIONS: { value: StartPageId; label: string }[] = [
  { value: "last", label: "Last visited page" },
  { value: "home", label: "Home" },
  { value: "trading", label: "Trade" },
  { value: "markets", label: "Markets" },
];

export const THEME_OPTIONS = [{ value: "light" as const, label: "Light" }];

export const DEFAULT_ORDER_TYPE_OPTIONS: {
  value: DefaultOrderType;
  label: string;
}[] = [
  { value: "LIMIT", label: "Limit" },
  { value: "MARKET", label: "Market" },
];

export const PRICE_DECIMALS_OPTIONS: {
  value: PriceDecimalsPref;
  label: string;
}[] = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2 decimals" },
  { value: "4", label: "4 decimals" },
  { value: "6", label: "6 decimals" },
  { value: "8", label: "8 decimals" },
];

function isStartPage(value: unknown): value is StartPageId {
  return (
    value === "last" ||
    value === "home" ||
    value === "trading" ||
    value === "markets"
  );
}

function isDefaultOrderType(value: unknown): value is DefaultOrderType {
  return value === "LIMIT" || value === "MARKET";
}

function isPriceDecimals(value: unknown): value is PriceDecimalsPref {
  return (
    value === "auto" ||
    value === "2" ||
    value === "4" ||
    value === "6" ||
    value === "8"
  );
}

export function readDisplayPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_PREFS };
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      confirmOrders: Boolean(parsed.confirmOrders),
      showInfoTips:
        parsed.showInfoTips == null ? true : Boolean(parsed.showInfoTips),
      soundOnFill: Boolean(parsed.soundOnFill),
      startPage: isStartPage(parsed.startPage)
        ? parsed.startPage
        : DEFAULT_DISPLAY_PREFS.startPage,
      defaultOrderType: isDefaultOrderType(parsed.defaultOrderType)
        ? parsed.defaultOrderType
        : DEFAULT_DISPLAY_PREFS.defaultOrderType,
      priceDecimals: isPriceDecimals(parsed.priceDecimals)
        ? parsed.priceDecimals
        : DEFAULT_DISPLAY_PREFS.priceDecimals,
    };
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS };
  }
}

export function writeDisplayPrefs(prefs: DisplayPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function formatPrefLimitPrice(
  n: number,
  decimals: PriceDecimalsPref = readDisplayPrefs().priceDecimals,
): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (decimals !== "auto") {
    return n.toFixed(Number(decimals)).replace(/\.?0+$/, "");
  }
  if (n >= 100) return n.toFixed(1).replace(/\.0$/, "");
  if (n >= 1) return String(Number(n.toFixed(4)));
  return String(n);
}

export function startPagePath(prefs: DisplayPrefs = readDisplayPrefs()): string {
  switch (prefs.startPage) {
    case "trading":
      return "/trading";
    case "markets":
      return "/markets";
    case "last": {
      try {
        const last = sessionStorage.getItem("pioni.lastPath");
        if (last && last.startsWith("/") && !last.startsWith("/settings")) {
          return last;
        }
      } catch {
        /* ignore */
      }
      return "/home";
    }
    default:
      return "/home";
  }
}
