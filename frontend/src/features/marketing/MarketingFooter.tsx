import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingFooter() {
  return (
    <footer
      data-mkt="footer"
      className="mx-auto mt-20 w-full max-w-5xl border-t border-[var(--card-border)] px-4 py-10 sm:mt-24"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center" aria-label="Pioni home">
            <img src="/logo.svg" alt="Pioni" className="h-6" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            Paper trading for learning the desk. Simulated funds only.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          <Link to={SIGN_IN_PATH} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link to={SIGN_UP_PATH} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Create account
          </Link>
          <Link to="/trading" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Paper trading
          </Link>
          <Link to="/privacy" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Privacy
          </Link>
          <Link to="/terms" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Terms
          </Link>
        </nav>
      </div>
      <p className="mt-8 text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} Pioni. Simulated funds only. Not investment advice.
      </p>
    </footer>
  );
}
