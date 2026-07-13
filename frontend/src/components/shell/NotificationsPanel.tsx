import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useGetMyTradesQuery } from "../../features/portfolio/portfolioApi";
import { ActivityFillRow } from "../../features/home/ActivityFillRow";
import { CloseIcon, TablePinIcon, BellIcon } from "./shellIcons";

type InboxTab = "inbox" | "alerts";

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<InboxTab>("inbox");
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: 30 },
    { skip: !isSignedIn || tab !== "inbox" },
  );

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="flex h-full w-full max-w-[450px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0px_4px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-4">
        <span className="text-sm font-medium text-[var(--text-muted)]">Notifications</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Pin"
            title="Pin"
            className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
          >
            <TablePinIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={onClose}
            className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex shrink-0 gap-0 px-4 pb-3">
        <TabChip
          label="Inbox"
          active={tab === "inbox"}
          onClick={() => setTab("inbox")}
          side="start"
        />
        <TabChip
          label="Manage alerts"
          active={tab === "alerts"}
          onClick={() => setTab("alerts")}
          side="end"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {tab === "alerts" ? (
          <EmptyState
            title="No alerts yet"
            body="Price and order alerts will show up here once you create them."
          />
        ) : !isSignedIn ? (
          <EmptyState
            title="You are all caught up!"
            body="Sign in from the top bar to see your paper fills and alerts here."
          />
        ) : isLoading ? (
          <EmptyState title="Loading…" body="Fetching your recent fills." />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">Couldn’t load inbox.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : !data?.length ? (
          <EmptyState
            title="You are all caught up!"
            body="Your updates and alerts will show up here"
          />
        ) : (
          <ul className="flex list-none flex-col">
            {data.map((trade) => (
              <ActivityFillRow key={trade.id} trade={trade} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TabChip({
  label,
  active,
  onClick,
  side,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  side: "start" | "end";
}) {
  const radius =
    side === "start" ? "rounded-s-xl rounded-e-lg" : "rounded-e-xl rounded-s-lg";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rail-icon px-2 py-1.5 text-xs font-medium ${radius} ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-[var(--text-muted)]">
        <BellIcon className="h-8 w-8" />
      </span>
      <p className="text-base font-medium text-[var(--text-primary)]">{title}</p>
      <p className="text-sm text-[var(--text-muted)]">{body}</p>
    </div>
  );
}
