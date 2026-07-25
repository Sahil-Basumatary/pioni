import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useGetMyTradesQuery } from "../portfolio/portfolioApi";
import SignedOutUnlock from "../auth/SignedOutUnlock";
import TeachingEmpty from "../onboarding/TeachingEmpty";
import { ActivityFillRow } from "./ActivityFillRow";

const PREVIEW_LIMIT = 5;

export default function HomeActivity() {
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: PREVIEW_LIMIT },
    { skip: !isSignedIn },
  );
  const trades = data ?? [];

  return (
    <section className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">Activity</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!isSignedIn ? (
            <SignedOutUnlock size="panel" />
          ) : isLoading ? (
            <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">Loading…</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10">
              <p className="text-sm text-[var(--text-muted)]">Couldn’t load activity.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
              >
                Retry
              </button>
            </div>
          ) : !trades.length ? (
            <TeachingEmpty id="history_activity" size="panel" />
          ) : (
            <ul className="flex list-none flex-col -mx-2">
              {trades.map((trade) => (
                <ActivityFillRow key={trade.id} trade={trade} />
              ))}
            </ul>
          )}
        </div>
        <Link
          to="/history"
          className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-black/[0.06] px-3 text-sm font-medium text-[var(--text-muted)] hover:bg-black/[0.09] hover:text-[var(--text-primary)]"
        >
          See all activity
        </Link>
      </div>
    </section>
  );
}
