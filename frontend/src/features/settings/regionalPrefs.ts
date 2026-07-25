const KEY = "pioni.regionalPrefs";

export const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "ms-MY", label: "Bahasa Melayu" },
  { value: "cs-CZ", label: "Čeština" },
  { value: "da-DK", label: "Dansk" },
  { value: "de-DE", label: "Deutsch" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-419", label: "Español (Latinoamérica)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "fr-FR", label: "Français" },
  { value: "it-IT", label: "Italiano" },
  { value: "hu-HU", label: "Magyar" },
  { value: "nl-NL", label: "Nederlands" },
  { value: "nb-NO", label: "Norsk" },
  { value: "pl-PL", label: "Polski" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "ro-RO", label: "Română" },
  { value: "sv-SE", label: "Svenska" },
  { value: "vi-VN", label: "Tiếng Việt" },
  { value: "tr-TR", label: "Türkçe" },
  { value: "el-GR", label: "Ελληνικά" },
  { value: "ru-RU", label: "Русский" },
  { value: "uk-UA", label: "Українська" },
  { value: "ko-KR", label: "한국어" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
] as const;

export type AppLanguage = (typeof LANGUAGE_OPTIONS)[number]["value"];

export type RegionalPrefs = {
  timezone: string;
  currency: "USD";
  language: AppLanguage;
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

function parseLanguage(value: unknown): AppLanguage {
  if (
    typeof value === "string" &&
    LANGUAGE_OPTIONS.some((o) => o.value === value)
  ) {
    return value as AppLanguage;
  }
  return "en-US";
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
      language: parseLanguage(parsed.language),
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

export function languageLabel(value: AppLanguage): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function applyDocumentLanguage(language: AppLanguage): void {
  document.documentElement.lang = language;
}
