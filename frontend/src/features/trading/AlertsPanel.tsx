import { useState } from "react";
import { BellIcon, FilterIcon } from "../../components/shell/shellIcons";

type AlertsTab = "active" | "history";

export default function AlertsPanel() {
  const [tab, setTab] = useState<AlertsTab>("active");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pb-2">
      <div className="flex items-center justify-between px-2">
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
          className="inline-flex size-8 items-center justify-center rounded-lg bg-[rgba(104,107,130,0.08)] p-1.5 text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          <FilterIcon className="h-5 w-5" />
        </button>
      </div>
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
          className="flex h-9 w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
        >
          Create new alert
        </button>
      </div>
    </div>
  );
}
