import { SignedIn } from "@clerk/clerk-react";
import { formatUsd } from "../../utils/formatters";
import { useGetMyPortfolioQuery } from "../../features/portfolio/portfolioApi";

export default function BalanceChip() {
  return (
    <SignedIn>
      <SignedInBalance />
    </SignedIn>
  );
}

function SignedInBalance() {
  const { data, isLoading, isError } = useGetMyPortfolioQuery();
  if (isLoading) {
    return (
      <span className="text-sm font-medium text-[var(--text-muted)]">Loading…</span>
    );
  }
  if (isError || !data) {
    return (
      <span className="text-sm font-medium text-[var(--text-muted)]">—</span>
    );
  }
  return (
    <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
      {formatUsd(data.cash_balance)}
    </span>
  );
}
