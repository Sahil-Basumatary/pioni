import { NavLink } from "react-router-dom";
import { LEGAL } from "../pages/legal/legalConfig";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--card-bg)]/60">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-12 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">Paper trading only.</span>{" "}
          Simulated funds. Not financial advice.
        </p>
        <nav className="flex items-center gap-4 text-xs">
          <NavLink
            to="/privacy"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Privacy
          </NavLink>
          <NavLink
            to="/terms"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Terms
          </NavLink>
          <span className="text-[var(--text-muted)]">
            © {new Date().getFullYear()} {LEGAL.product}
          </span>
        </nav>
      </div>
    </footer>
  );
}
