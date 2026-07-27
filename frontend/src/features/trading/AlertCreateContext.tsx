import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppSelector } from "../../app/hooks";
import { selectSymbol } from "../instrument/instrumentSlice";

type AlertCreateContextValue = {
  open: boolean;
  symbol: string;
  openCreateAlert: (symbol?: string) => void;
  closeCreateAlert: () => void;
};

const AlertCreateContext = createContext<AlertCreateContextValue | null>(null);

export function AlertCreateProvider({ children }: { children: ReactNode }) {
  const currentSymbol = useAppSelector(selectSymbol);
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(currentSymbol);

  const openCreateAlert = useCallback(
    (next?: string) => {
      setSymbol((next ?? currentSymbol).toUpperCase());
      setOpen(true);
    },
    [currentSymbol],
  );

  const closeCreateAlert = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, symbol, openCreateAlert, closeCreateAlert }),
    [open, symbol, openCreateAlert, closeCreateAlert],
  );

  return (
    <AlertCreateContext.Provider value={value}>
      {children}
    </AlertCreateContext.Provider>
  );
}

export function useAlertCreate() {
  const ctx = useContext(AlertCreateContext);
  if (!ctx) {
    throw new Error("useAlertCreate must be used within AlertCreateProvider");
  }
  return ctx;
}
