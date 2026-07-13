import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readFavorites, toggleFavorite, writeFavorites } from "./favorites";

type MarketSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  favorites: string[];
  toggleFav: (symbol: string) => void;
};

const MarketSearchContext = createContext<MarketSearchContextValue | null>(null);

export function MarketSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() =>
    typeof window !== "undefined" ? readFavorites() : [],
  );

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  const toggleFav = useCallback((symbol: string) => {
    setFavorites((current) => {
      const next = toggleFavorite(symbol, current);
      writeFavorites(next);
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ open, openSearch, closeSearch, favorites, toggleFav }),
    [open, openSearch, closeSearch, favorites, toggleFav],
  );

  return (
    <MarketSearchContext.Provider value={value}>{children}</MarketSearchContext.Provider>
  );
}

export function useMarketSearch(): MarketSearchContextValue {
  const ctx = useContext(MarketSearchContext);
  if (!ctx) {
    throw new Error("useMarketSearch must be used within MarketSearchProvider");
  }
  return ctx;
}
