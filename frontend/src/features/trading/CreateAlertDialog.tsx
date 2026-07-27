import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { CloseSmallIcon } from "../../components/shell/shellIcons";
import SignedOutUnlock from "../auth/SignedOutUnlock";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import { useMarketSocket } from "../market/MarketSocketProvider";
import { useToast } from "../toasts/useToast";
import { useAlertCreate } from "./AlertCreateContext";
import { formatAlertPair } from "./alertFormat";
import {
  useCreatePriceAlertMutation,
  type AlertCondition,
} from "./alertsApi";

export default function CreateAlertDialog() {
  const { open, symbol, closeCreateAlert } = useAlertCreate();
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const live = useLiveMarketTrade(symbol);
  const { subscribe, unsubscribe } = useMarketSocket();
  const [createAlert, { isLoading }] = useCreatePriceAlertMutation();
  const [condition, setCondition] = useState<AlertCondition>("ABOVE");
  const [priceRaw, setPriceRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    subscribe([symbol]);
    return () => unsubscribe([symbol]);
  }, [open, symbol, subscribe, unsubscribe]);

  useEffect(() => {
    if (!open) return;
    setCondition("ABOVE");
    setError(null);
    const n = live ? Number(live.price) : NaN;
    setPriceRaw(Number.isFinite(n) && n > 0 ? String(n) : "");
  }, [open, symbol]);

  useEffect(() => {
    if (!open || priceRaw) return;
    const n = live ? Number(live.price) : NaN;
    if (Number.isFinite(n) && n > 0) setPriceRaw(String(n));
  }, [live, open, priceRaw]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const onSubmit = async () => {
    const price = Number(priceRaw.replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price");
      return;
    }
    setError(null);
    try {
      await createAlert({
        symbol,
        condition,
        target_price: String(price),
      }).unwrap();
      toast({ title: "Alert created", tone: "positive" });
      closeCreateAlert();
    } catch {
      setError("Couldn’t create alert. Try again.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[min(12vh,150px)]">
      <button
        type="button"
        aria-label="Dismiss alert"
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
        onClick={closeCreateAlert}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create alert"
        className="relative z-[1] w-full max-w-[400px] rounded-[20px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h1 className="text-base font-medium leading-6">Create alert</h1>
          <button
            type="button"
            aria-label="Close"
            onClick={closeCreateAlert}
            className="rail-icon inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[rgba(104,107,130,0.08)]"
          >
            <CloseSmallIcon className="h-4 w-4" />
          </button>
        </div>
        {!isSignedIn ? (
          <div className="px-5 pb-5">
            <SignedOutUnlock size="compact" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
            <div>
              <p className="text-xs font-medium text-[rgb(104,107,130)]">Market</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {formatAlertPair(symbol)}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[rgb(104,107,130)]">
                Condition
              </p>
              <div className="inline-flex rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5">
                {(
                  [
                    { id: "ABOVE", label: "Rises to" },
                    { id: "BELOW", label: "Falls to" },
                  ] as const
                ).map((opt) => {
                  const active = condition === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCondition(opt.id)}
                      className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-white text-[var(--text-primary)]"
                          : "text-[rgb(104,107,130)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-[rgb(104,107,130)]">
                Price
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value.replace(/[^0-9.]/g, ""))}
                className="mt-1.5 h-10 w-full rounded-xl border border-[rgba(104,107,130,0.24)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            {error ? (
              <p className="text-sm text-[rgb(209,29,69)]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void onSubmit()}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-medium text-white hover:bg-[var(--accent-soft)] disabled:opacity-60"
            >
              {isLoading ? "Creating…" : "Create alert"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
