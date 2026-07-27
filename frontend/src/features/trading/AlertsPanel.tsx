import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { BellIcon, FilterIcon } from "../../components/shell/shellIcons";
import SignedOutUnlock from "../auth/SignedOutUnlock";
import { useAppSelector } from "../../app/hooks";
import { selectSymbol } from "../instrument/instrumentSlice";
import { useToast } from "../toasts/useToast";
import { useAlertCreate } from "./AlertCreateContext";
import {
  formatAlertCondition,
  formatAlertPair,
  formatAlertPrice,
} from "./alertFormat";
import {
  useCancelPriceAlertMutation,
  useListPriceAlertsQuery,
  type AlertsTab,
  type PriceAlert,
} from "./alertsApi";

export default function AlertsPanel() {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const currentSymbol = useAppSelector(selectSymbol);
  const { openCreateAlert } = useAlertCreate();
  const [tab, setTab] = useState<AlertsTab>("active");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "current">("all");
  const [cancelAlert, { isLoading: cancelling }] = useCancelPriceAlertMutation();

  const symbolFilter = filterMode === "current" ? currentSymbol : null;
  const { data, isLoading, isError, refetch } = useListPriceAlertsQuery(
    { tab, symbol: symbolFilter },
    { skip: !isSignedIn },
  );
  const alerts = data ?? [];

  const empty = !isLoading && !isError && alerts.length === 0;

  if (!isSignedIn) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SignedOutUnlock size="panel" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pb-2">
      <div className="relative flex items-center justify-between px-2">
        <div
          role="tablist"
          className="inline-flex rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
        >
          {(["active", "history"] as const).map((id) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`rounded-[10px] px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-white text-[var(--text-primary)]"
                    : "text-[rgb(104,107,130)]"
                }`}
              >
                {id === "active" ? "Active" : "History"}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Filter"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((v) => !v)}
          className={`inline-flex size-8 items-center justify-center rounded-lg p-1.5 hover:bg-[rgba(104,107,130,0.12)] ${
            filterMode === "current"
              ? "bg-[rgba(42,42,42,0.12)] text-[var(--text-primary)]"
              : "bg-[rgba(104,107,130,0.08)] text-[rgb(104,107,130)]"
          }`}
        >
          <FilterIcon className="h-5 w-5" />
        </button>
        {filterOpen ? (
          <div className="absolute end-2 top-10 z-10 w-44 rounded-xl border border-[rgba(104,107,130,0.16)] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {(
              [
                { id: "all", label: "All markets" },
                { id: "current", label: `Current · ${formatAlertPair(currentSymbol)}` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setFilterMode(opt.id);
                  setFilterOpen(false);
                }}
                className={`flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium ${
                  filterMode === opt.id
                    ? "bg-[rgba(104,107,130,0.08)] text-[var(--text-primary)]"
                    : "text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.06)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[rgb(104,107,130)]">
          Loading alerts…
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-[rgb(104,107,130)]">Couldn’t load alerts.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-[rgba(104,107,130,0.08)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
          >
            Retry
          </button>
        </div>
      ) : empty ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-3 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-[rgba(42,42,42,0.16)] p-2 text-[var(--accent)]">
                <BellIcon className="h-8 w-8" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <p className="text-base font-medium text-[var(--text-primary)]">
                  Create an alert
                </p>
                <p className="text-sm font-normal text-[rgb(104,107,130)]">
                  Never miss a trading opportunity
                </p>
              </div>
            </div>
          </div>
          <div className="mx-2">
            <button
              type="button"
              onClick={() => openCreateAlert(currentSymbol)}
              className="flex h-9 w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
            >
              Create new alert
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto px-2">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                tab={tab}
                busy={cancelling}
                onCancel={async () => {
                  try {
                    await cancelAlert(alert.id).unwrap();
                    toast({ title: "Alert cancelled", tone: "neutral" });
                  } catch {
                    toast({ title: "Couldn’t cancel alert", tone: "negative" });
                  }
                }}
              />
            ))}
          </ul>
          {tab === "active" ? (
            <div className="mx-2">
              <button
                type="button"
                onClick={() => openCreateAlert(currentSymbol)}
                className="flex h-9 w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
              >
                Create new alert
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function AlertRow({
  alert,
  tab,
  busy,
  onCancel,
}: {
  alert: PriceAlert;
  tab: AlertsTab;
  busy: boolean;
  onCancel: () => void | Promise<void>;
}) {
  const statusLabel =
    alert.status === "TRIGGERED"
      ? "Triggered"
      : alert.status === "CANCELLED"
        ? "Cancelled"
        : formatAlertCondition(alert.condition);

  return (
    <li className="flex items-center justify-between gap-2 border-b border-[rgba(104,107,130,0.12)] py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {formatAlertPair(alert.symbol)}
        </p>
        <p className="truncate text-xs text-[rgb(104,107,130)]">
          {statusLabel} {formatAlertPrice(alert.target_price)}
        </p>
      </div>
      {tab === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onCancel()}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.08)] hover:text-[var(--text-primary)] disabled:opacity-60"
        >
          Cancel
        </button>
      ) : (
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[rgb(104,107,130)]">
          {alert.status === "TRIGGERED" ? "Triggered" : "Cancelled"}
        </span>
      )}
    </li>
  );
}
