const KEY = "pioni.displayPrefs";

export type StartPageId = "last" | "home" | "trading" | "markets";

export type DisplayPrefs = {
  confirmOrders: boolean;
  showInfoTips: boolean;
  soundOnFill: boolean;
  startPage: StartPageId;
};

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = {
  confirmOrders: false,
  showInfoTips: true,
  soundOnFill: false,
  startPage: "home",
};

export const START_PAGE_OPTIONS: { value: StartPageId; label: string }[] = [
  { value: "last", label: "Last visited page" },
  { value: "home", label: "Home" },
  { value: "trading", label: "Trade" },
  { value: "markets", label: "Markets" },
];

export const THEME_OPTIONS = [{ value: "light" as const, label: "Light" }];

function isStartPage(value: unknown): value is StartPageId {
  return (
    value === "last" ||
    value === "home" ||
    value === "trading" ||
    value === "markets"
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
    };
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS };
  }
}

export function writeDisplayPrefs(prefs: DisplayPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
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
