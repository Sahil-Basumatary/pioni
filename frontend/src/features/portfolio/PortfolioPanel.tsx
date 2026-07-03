import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { formatUsd } from "../../utils/formatters";
import { useGetMyPortfolioQuery } from "./portfolioApi";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 px-4 py-3">
      {children}
    </div>
  );
}

function Balance() {
  const { data, isLoading, isError, refetch } = useGetMyPortfolioQuery();
  if (isLoading) {
    return (
      <Shell>
        <span className="text-sm text-[var(--text-muted)]">Loading portfolio…</span>
      </Shell>
    );
  }
  if (isError || !data) {
    return (
      <Shell>
        <span className="text-sm text-[var(--text-muted)]">Couldn’t load your portfolio.</span>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Retry
        </button>
      </Shell>
    );
  }
  return (
    <Shell>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Paper balance
        </span>
        <span className="text-lg font-semibold text-[var(--text-primary)]">
          {formatUsd(data.cash_balance)}
        </span>
      </div>
      <span className="text-xs text-[var(--text-muted)]">{data.name}</span>
    </Shell>
  );
}

export default function PortfolioPanel() {
  return (
    <>
      <SignedIn>
        <Balance />
      </SignedIn>
      <SignedOut>
        <Shell>
          <span className="text-sm text-[var(--text-muted)]">
            Sign in to start paper trading with a virtual balance.
          </span>
          <SignInButton mode="modal">
            <button className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white">
              Sign in
            </button>
          </SignInButton>
        </Shell>
      </SignedOut>
    </>
  );
}
