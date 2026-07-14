import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useGetMyTradesQuery } from "../features/portfolio/portfolioApi";
import { ActivityFillRow } from "../features/home/ActivityFillRow";

const TABS = ["Ledger", "Orders", "Trades", "Positions"] as const;
type Tab = (typeof TABS)[number];

export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<Tab>("Trades");
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: 100 },
    { skip: !isSignedIn || tab !== "Trades" },
  );

  return (
    <div className="mx-auto flex w-full max-w-[1750px] flex-col gap-3 px-2 py-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">History</h1>
      </div>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="History sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rail-icon rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t
                ? "bg-black/[0.08] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="min-h-[320px] overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
        {tab !== "Trades" ? (
          <p className="px-2 py-12 text-center text-sm text-[var(--text-muted)]">
            {tab} history is coming next — Trades shows your paper fills now.
          </p>
        ) : !isSignedIn ? (
          <p className="px-2 py-12 text-center text-sm text-[var(--text-muted)]">
            Sign in from the top bar to see your trade history.
          </p>
        ) : isLoading ? (
          <p className="px-2 py-12 text-center text-sm text-[var(--text-muted)]">Loading…</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-2 py-12">
            <p className="text-sm text-[var(--text-muted)]">Couldn’t load trades.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : !data?.length ? (
          <p className="px-2 py-12 text-center text-sm text-[var(--text-muted)]">
            No trades yet — fill a paper order from Trade and it will land here.
          </p>
        ) : (
          <ul className="mx-auto flex max-w-xl list-none flex-col">
            {data.map((trade) => (
              <ActivityFillRow key={trade.id} trade={trade} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
