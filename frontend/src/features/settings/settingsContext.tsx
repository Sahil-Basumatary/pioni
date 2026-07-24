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
  isSettingsSection,
  type SettingsSectionId,
} from "./settingsNav";

const HASH_PREFIX = "#dialog/settings/";

type SettingsContextValue = {
  open: boolean;
  section: SettingsSectionId;
  openSettings: (section?: SettingsSectionId) => void;
  setSection: (section: SettingsSectionId) => void;
  closeSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseSettingsHash(hash: string): SettingsSectionId | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const id = hash.slice(HASH_PREFIX.length).split("/")[0];
  return isSettingsSection(id) ? id : "account";
}

function writeSettingsHash(section: SettingsSectionId) {
  const next = `${HASH_PREFIX}${section}`;
  if (window.location.hash === next) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${next}`,
  );
}

function clearSettingsHash() {
  if (!window.location.hash.startsWith(HASH_PREFIX)) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSectionState] = useState<SettingsSectionId>("account");

  const openSettings = useCallback((next: SettingsSectionId = "account") => {
    setSectionState(next);
    setOpen(true);
    writeSettingsHash(next);
  }, []);

  const setSection = useCallback((next: SettingsSectionId) => {
    setSectionState(next);
    if (window.location.hash.startsWith(HASH_PREFIX)) {
      writeSettingsHash(next);
    }
  }, []);

  const closeSettings = useCallback(() => {
    setOpen(false);
    clearSettingsHash();
  }, []);

  useEffect(() => {
    const sync = () => {
      const parsed = parseSettingsHash(window.location.hash);
      if (parsed) {
        setSectionState(parsed);
        setOpen(true);
      } else {
        setOpen(false);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSettings();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSettings]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = useMemo(
    () => ({
      open,
      section,
      openSettings,
      setSection,
      closeSettings,
    }),
    [open, section, openSettings, setSection, closeSettings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
