import { useState } from "react";

type AlertsTab = "active" | "history";

export default function AlertsPanel() {
  const [tab, setTab] = useState<AlertsTab>("active");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pt-2">
      <div className="mx-2 flex items-center justify-between">
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
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  active
                    ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm"
                    : "text-[rgb(104,107,130)]"
                }`}
              >
                {id === "active" ? "Active" : "History"}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 pb-8 text-center">
        <p className="text-base font-medium text-[var(--text-primary)]">
          Create an alert
        </p>
        <p className="text-sm text-[rgb(104,107,130)]">
          Never miss a trading opportunity
        </p>
        <button
          type="button"
          className="mt-2 inline-flex h-9 items-center rounded-xl bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          Create new alert
        </button>
      </div>
    </div>
  );
}
