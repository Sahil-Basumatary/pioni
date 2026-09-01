import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentLanguage,
  readRegionalPrefs,
  writeRegionalPrefs,
  type AppLanguage,
} from "../settings/regionalPrefs";
import { enUS, loadLocalePack } from "../i18n/loadLocalePack";
import type { LocalePack } from "../i18n/localePack";
import { translateFromPack } from "../i18n/translateFromPack";
import type { MessageKey } from "../i18n/translate";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(
    () => readRegionalPrefs().language,
  );
  const [pack, setPack] = useState<LocalePack | null>(() =>
    readRegionalPrefs().language === "en-US" ? enUS : null,
  );

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    void loadLocalePack(language).then((next) => {
      if (!cancelled) setPack(next);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== "pioni.regionalPrefs" || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as { language?: AppLanguage };
        if (parsed.language) setLanguageState(parsed.language);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    const prefs = readRegionalPrefs();
    writeRegionalPrefs({ ...prefs, language: next });
    applyDocumentLanguage(next);
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string>) =>
      translateFromPack(pack ?? enUS, key, vars),
    [pack],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  if (!pack) return null;

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
