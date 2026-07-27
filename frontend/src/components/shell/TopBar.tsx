import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AppSwitcher from "./AppSwitcher";
import BalanceChip from "./BalanceChip";
import LayoutsMenu from "./LayoutsMenu";
import ProductSwitcher from "./ProductSwitcher";
import TopBarLanguageMenu from "./TopBarLanguageMenu";
import { useMarketSearch } from "../../features/markets/MarketSearchContext";
import { useConvert } from "../../features/convert/ConvertContext";
import { useSettings } from "../../features/settings/settingsContext";
import { ConvertIcon, DepositIcon, SearchIcon, UserIcon } from "./shellIcons";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../../features/auth/authRoutes";

export default function TopBar({ compact = false }: { compact?: boolean }) {
  const { openSearch } = useMarketSearch();
  const { openConvert } = useConvert();
  const { openSettings } = useSettings();

  if (compact) {
    return (
      <header
        className="shrink-0 border-b border-[var(--card-border)] bg-[var(--card-bg)]"
        role="navigation"
      >
        <div className="flex h-12 w-full items-center justify-between gap-0 overflow-hidden px-2 ps-4">
          <div className="flex h-full min-w-0 grow items-center gap-3">
            <SignedIn>
              <NavLink to="/home" className="flex shrink-0 items-center gap-1.5 p-1">
                <img src="/logo.svg" alt="Pioni" className="h-5" />
              </NavLink>
            </SignedIn>
            <SignedOut>
              <NavLink to="/trading" className="flex shrink-0 items-center gap-1.5 p-1">
                <img src="/logo.svg" alt="Pioni" className="h-5" />
              </NavLink>
            </SignedOut>
            <ProductSwitcher />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div
              data-tour="balance"
              className="inline-flex items-center rounded-lg bg-black/[0.06] px-2.5 py-1.5 text-sm font-medium tabular-nums text-[var(--text-primary)]"
            >
              <BalanceChip />
              <SignedOut>
                <span aria-hidden="true">-</span>
              </SignedOut>
            </div>
            <SignedIn>
              <button
                type="button"
                aria-label="Account settings"
                onClick={() => openSettings("account")}
                className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                <UserIcon className="h-6 w-6" />
              </button>
              {/* No right rail on compact, so keep the app switcher reachable */}
              <AppSwitcher />
            </SignedIn>
            <SignedOut>
              <TopBarLanguageMenu />
              <AuthButtons />
              <AppSwitcher />
            </SignedOut>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-[1750px] items-center gap-3 px-2">
        <SignedIn>
          <NavLink to="/home" className="flex shrink-0 items-center">
            <img src="/logo.svg" alt="Pioni" className="h-9" />
          </NavLink>
        </SignedIn>
        <SignedOut>
          <NavLink to="/trading" className="flex shrink-0 items-center">
            <img src="/logo.svg" alt="Pioni" className="h-9" />
          </NavLink>
        </SignedOut>
        <button
          type="button"
          onClick={openSearch}
          className="rail-icon ml-2 hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-left text-sm text-[var(--text-muted)] hover:border-[var(--accent)] sm:flex md:max-w-sm"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="truncate">Search for a market</span>
          <kbd className="ml-auto rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            ⌘K
          </kbd>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <LayoutsMenu />
          <SignedIn>
            <Link
              to="/deposit"
              className="hidden items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg)] sm:inline-flex"
            >
              <DepositIcon className="h-4 w-4" />
              Deposit
            </Link>
            <button
              type="button"
              onClick={() => openConvert()}
              className="hidden items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg)] md:inline-flex"
            >
              <ConvertIcon className="h-4 w-4" />
              Convert
            </button>
            <span data-tour="balance">
              <BalanceChip />
            </span>
          </SignedIn>
          <SignedOut>
            <TopBarLanguageMenu />
            <AuthButtons />
            <AppSwitcher />
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

function AuthButtons() {
  return (
    <div className="relative z-[60] flex items-center gap-1">
      <Link
        to={SIGN_IN_PATH}
        className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
      >
        Sign in
      </Link>
      <Link
        to={SIGN_UP_PATH}
        className="rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
      >
        Sign up
      </Link>
    </div>
  );
}
