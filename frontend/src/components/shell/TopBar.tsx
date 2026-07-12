import { Link, NavLink } from "react-router-dom";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import BalanceChip from "./BalanceChip";

export default function TopBar() {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-[1750px] items-center gap-3 px-2">
        <NavLink to="/home" className="flex shrink-0 items-center">
          <img src="/logo.svg" alt="Pioni" className="h-9" />
        </NavLink>
        <button
          type="button"
          disabled
          title="Market search comes next"
          className="ml-2 hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-left text-sm text-[var(--text-muted)] opacity-70 sm:flex md:max-w-sm"
        >
          <SearchIcon />
          <span className="truncate">Search for a market</span>
          <kbd className="ml-auto rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            ⌘K
          </kbd>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/deposit"
            className="hidden rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg)] sm:inline-flex"
          >
            Deposit
          </Link>
          <Link
            to="/convert"
            className="hidden rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg)] md:inline-flex"
          >
            Convert
          </Link>
          <BalanceChip />
          <SignedIn>
            <UserButton afterSignOutUrl="/home" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
    >
      <circle
        cx="7"
        cy="7"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m10.5 10.5 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
