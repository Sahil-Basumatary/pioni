import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { formatUsd } from "../../utils/formatters";
import { useGetMyPortfolioQuery, useResetPortfolioMutation } from "./portfolioApi";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 px-4 py-3">
      {children}
    </div>
  );
}

function ResetDialog({
  startingBalance,
  onClose,
}: {
  startingBalance: string;
  onClose: () => void;
}) {
  const [resetPortfolio, { isLoading }] = useResetPortfolioMutation();
  const [error, setError] = useState(false);
  async function handleReset() {
    setError(false);
    try {
      await resetPortfolio().unwrap();
      onClose();
    } catch {
      setError(true);
    }
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Reset your practice account?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This clears your positions and trade history and restores your starting balance of{" "}
          {formatUsd(startingBalance)}. This can’t be undone.
        </p>
        {error && (
          <p className="mt-3 text-xs text-red-500">
            Couldn’t reset just now — please try again.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? "Resetting…" : "Reset account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Balance() {
  const { data, isLoading, isError, refetch } = useGetMyPortfolioQuery();
  const [confirming, setConfirming] = useState(false);
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
    <>
      <Shell>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Paper balance
          </span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            {formatUsd(data.cash_balance)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{data.name}</span>
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Reset
          </button>
        </div>
      </Shell>
      {confirming && (
        <ResetDialog
          startingBalance={data.initial_balance}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}

export default function PortfolioPanel() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) {
    return (
      <Shell>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Paper balance
          </span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">—</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Sign in from the top bar to start paper trading.
        </span>
      </Shell>
    );
  }
  return <Balance />;
}
