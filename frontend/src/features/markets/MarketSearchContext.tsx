import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "../toasts/useToast";
import {
  FAVORITES_STORAGE_KEY,
  mergeFavorites,
  readFavorites,
  toggleFavorite,
  writeFavorites,
} from "./favorites";
import {
  useGetMyFavoritesQuery,
  usePutMyFavoritesMutation,
} from "./favoritesApi";

type MarketSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  favorites: string[];
  toggleFav: (symbol: string) => void;
};

const MarketSearchContext = createContext<MarketSearchContextValue | null>(null);

export function MarketSearchProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() =>
    typeof window !== "undefined" ? readFavorites() : [],
  );
  const mergedOnce = useRef(false);
  const { data: remote } = useGetMyFavoritesQuery(undefined, {
    skip: !isSignedIn,
  });
  const [putFavorites] = usePutMyFavoritesMutation();

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!isSignedIn) {
      mergedOnce.current = false;
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !remote || mergedOnce.current) return;
    mergedOnce.current = true;
    const local = readFavorites();
    const merged = mergeFavorites(remote.symbols ?? [], local);
    setFavorites(merged);
    writeFavorites(merged);
    const serverNorm = mergeFavorites(remote.symbols ?? [], []);
    if (merged.join("\0") !== serverNorm.join("\0")) {
      void putFavorites({ symbols: merged });
    }
  }, [isSignedIn, remote, putFavorites]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== FAVORITES_STORAGE_KEY) return;
      setFavorites(readFavorites());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFav = useCallback(
    (symbol: string) => {
      setFavorites((current) => {
        const next = toggleFavorite(symbol, current);
        writeFavorites(next);
        if (isSignedIn) {
          void putFavorites({ symbols: next })
            .unwrap()
            .catch(() => {
              setFavorites(current);
              writeFavorites(current);
              toast("Couldn't save favorites");
            });
        }
        return next;
      });
    },
    [isSignedIn, putFavorites, toast],
  );

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
