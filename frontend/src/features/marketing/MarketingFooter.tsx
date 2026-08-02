import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingFooter() {
  return (
    <footer
      data-mkt="footer"
      className="border-t border-[var(--card-border)] bg-[#F1F1F1]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center" aria-label="Pioni home">
              <img src="/logo.svg" alt="Pioni" className="h-8" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              Paper trading for learning the desk. Simulated funds only.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Product
            </h3>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm" aria-label="Product">
              <Link to="/trading" className="text-[var(--text-primary)] hover:opacity-70">
                Paper trading
              </Link>
              <Link to="/markets" className="text-[var(--text-primary)] hover:opacity-70">
                Markets
              </Link>
              <Link to={SIGN_UP_PATH} className="text-[var(--text-primary)] hover:opacity-70">
                Create account
              </Link>
              <Link to={SIGN_IN_PATH} className="text-[var(--text-primary)] hover:opacity-70">
                Sign in
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Company
            </h3>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm" aria-label="Company">
              <Link to="/privacy" className="text-[var(--text-primary)] hover:opacity-70">
                Privacy
              </Link>
              <Link to="/terms" className="text-[var(--text-primary)] hover:opacity-70">
                Terms
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Paper only
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
              Balances, fills, and fees are simulated. Pioni is not a brokerage
              and not investment advice.
            </p>
          </div>
        </div>
        <p className="mt-12 border-t border-[var(--card-border)] pt-6 text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Pioni. Simulated funds only. Not investment advice.
        </p>
      </div>
    </footer>
  );
}
