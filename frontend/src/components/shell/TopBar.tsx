import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AppSwitcher from "./AppSwitcher";
import BalanceChip from "./BalanceChip";
import LayoutsMenu from "./LayoutsMenu";
import ProductSwitcher from "./ProductSwitcher";
import TopBarLanguageMenu from "./TopBarLanguageMenu";
import PioniLogo from "../PioniLogo";
import { useMarketSearch } from "../../features/markets/MarketSearchContext";
import { useConvert } from "../../features/convert/ConvertContext";
import { useSettings } from "../../features/settings/settingsContext";
import { useLanguage } from "../../features/auth/LanguageProvider";
import { ConvertIcon, DepositIcon, SearchIcon, UserIcon } from "./shellIcons";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../../features/auth/authRoutes";

export default function TopBar({ compact = false }: { compact?: boolean }) {
  const { openSearch } = useMarketSearch();
  const { openConvert } = useConvert();
  const { openSettings } = useSettings();
  const { t } = useLanguage();

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
                <PioniLogo />
              </NavLink>
            </SignedIn>
            <SignedOut>
              <NavLink to="/trading" className="flex shrink-0 items-center gap-1.5 p-1">
                <PioniLogo />
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
                aria-label={t("accountSettings")}
                onClick={() => openSettings("account")}
                className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                <UserIcon className="h-6 w-6" />
              </button>
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
            <PioniLogo />
          </NavLink>
        </SignedIn>
        <SignedOut>
          <NavLink to="/trading" className="flex shrink-0 items-center">
            <PioniLogo />
          </NavLink>
        </SignedOut>
        <button
          type="button"
          onClick={openSearch}
          className="rail-icon ml-2 hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-left text-sm text-[var(--text-muted)] hover:border-[var(--accent)] sm:flex md:max-w-sm"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="truncate">{t("searchForMarket")}</span>
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
              {t("deposit")}
            </Link>
            <button
              type="button"
              onClick={() => openConvert()}
              className="hidden items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg)] md:inline-flex"
            >
              <ConvertIcon className="h-4 w-4" />
              {t("convert")}
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
  const { t } = useLanguage();
  return (
    <div className="relative z-[60] flex items-center gap-1">
      <Link
        to={SIGN_IN_PATH}
        className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
      >
        {t("signIn")}
      </Link>
      <Link
        to={SIGN_UP_PATH}
        className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
      >
        {t("signUp")}
      </Link>
    </div>
  );
}
