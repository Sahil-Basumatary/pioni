import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingHeader() {
  return (
    <header
      data-mkt="header"
      className="sticky top-0 z-20 h-16 shrink-0 bg-[#F6F5F9]/90 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" aria-label="Pioni home">
          <img src="/logo.svg" alt="Pioni" className="h-9" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={SIGN_IN_PATH}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Sign in
          </Link>
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--text-primary)] px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}
