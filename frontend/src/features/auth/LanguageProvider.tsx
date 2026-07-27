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
import { translate, type MessageKey } from "../i18n/translate";

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

  useEffect(() => {
    applyDocumentLanguage(language);
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
      translate(language, key, vars),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

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
