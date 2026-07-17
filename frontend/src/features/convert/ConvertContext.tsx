import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const HASH_PREFIX = "#dialog/convert-asset/";

type ConvertContextValue = {
  open: boolean;
  fromSymbol: string;
  toSymbol: string;
  openConvert: (from?: string, to?: string) => void;
  closeConvert: () => void;
  setPair: (from: string, to: string) => void;
};

const ConvertContext = createContext<ConvertContextValue | null>(null);

function parseConvertHash(hash: string): { from: string; to: string } | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const parts = hash.slice(HASH_PREFIX.length).split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  return { from: parts[0].toUpperCase(), to: parts[1].toUpperCase() };
}

function writeConvertHash(from: string, to: string) {
  const next = `${HASH_PREFIX}${from}/${to}`;
  if (window.location.hash === next) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${next}`,
  );
}

function clearConvertHash() {
  if (!window.location.hash.startsWith(HASH_PREFIX)) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function ConvertProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fromSymbol, setFromSymbol] = useState("USD");
  const [toSymbol, setToSymbol] = useState("BTC");

  const openConvert = useCallback((from = "USD", to = "BTC") => {
    setFromSymbol(from.toUpperCase());
    setToSymbol(to.toUpperCase());
    setOpen(true);
    writeConvertHash(from.toUpperCase(), to.toUpperCase());
  }, []);

  const closeConvert = useCallback(() => {
    setOpen(false);
    clearConvertHash();
  }, []);

  const setPair = useCallback((from: string, to: string) => {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    setFromSymbol(f);
    setToSymbol(t);
    if (window.location.hash.startsWith(HASH_PREFIX)) {
      writeConvertHash(f, t);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const parsed = parseConvertHash(window.location.hash);
      if (parsed) {
        setFromSymbol(parsed.from);
        setToSymbol(parsed.to);
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
      if (e.key === "Escape") closeConvert();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeConvert]);

  const value = useMemo(
    () => ({
      open,
      fromSymbol,
      toSymbol,
      openConvert,
      closeConvert,
      setPair,
    }),
    [open, fromSymbol, toSymbol, openConvert, closeConvert, setPair],
  );

  return (
    <ConvertContext.Provider value={value}>{children}</ConvertContext.Provider>
  );
}

export function useConvert(): ConvertContextValue {
  const ctx = useContext(ConvertContext);
  if (!ctx) {
    throw new Error("useConvert must be used within ConvertProvider");
  }
  return ctx;
}
