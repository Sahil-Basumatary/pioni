import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingHeader() {
  return (
    <header
      data-mkt="header"
      className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6"
    >
      <Link to="/" className="flex items-center" aria-label="Pioni home">
        <img src="/logo.svg" alt="Pioni" className="h-7" />
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
          className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Create account
        </Link>
      </div>
    </header>
  );
}
