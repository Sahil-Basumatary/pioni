const KEY = "pioni.regionalPrefs";

export type RegionalPrefs = {
  timezone: string;
  currency: "USD";
  language: "en-US";
  numberFormat: "en-US" | "de-DE";
};

export const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "[+00:00 GMT] London, Europe" },
  { value: "America/New_York", label: "[−05:00 EST] New York, America" },
  { value: "America/Los_Angeles", label: "[−08:00 PST] Los Angeles, America" },
  { value: "Asia/Kolkata", label: "[+05:30 IST] Kolkata, Asia" },
  { value: "Asia/Singapore", label: "[+08:00 SGT] Singapore, Asia" },
  { value: "UTC", label: "[+00:00 UTC] Coordinated Universal Time" },
] as const;

export const NUMBER_FORMAT_OPTIONS = [
  { value: "en-US" as const, label: "1,234,567.89" },
  { value: "de-DE" as const, label: "1.234.567,89" },
];

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_OPTIONS.some((o) => o.value === tz)) return tz;
  } catch {
    /* ignore */
  }
  return "Europe/London";
}

export const DEFAULT_REGIONAL_PREFS: RegionalPrefs = {
  timezone: "Europe/London",
  currency: "USD",
  language: "en-US",
  numberFormat: "en-US",
};

export function readRegionalPrefs(): RegionalPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { ...DEFAULT_REGIONAL_PREFS, timezone: detectTimezone() };
    }
    const parsed = JSON.parse(raw) as Partial<RegionalPrefs>;
    const timezone =
      typeof parsed.timezone === "string" &&
      TIMEZONE_OPTIONS.some((o) => o.value === parsed.timezone)
        ? parsed.timezone
        : detectTimezone();
    const numberFormat =
      parsed.numberFormat === "de-DE" ? "de-DE" : "en-US";
    return {
      timezone,
      currency: "USD",
      language: "en-US",
      numberFormat,
    };
  } catch {
    return { ...DEFAULT_REGIONAL_PREFS, timezone: detectTimezone() };
  }
}

export function writeRegionalPrefs(prefs: RegionalPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function timezoneLabel(value: string): string {
  return TIMEZONE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function numberFormatLabel(value: RegionalPrefs["numberFormat"]): string {
  return NUMBER_FORMAT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
