import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Paper trading", to: "/trading" },
      { label: "Markets", to: "/markets" },
      { label: "Margin practice", to: "/trade/margin" },
      { label: "Create account", to: SIGN_UP_PATH },
      { label: "Sign in", to: SIGN_IN_PATH },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Help centre", to: "/help" },
      { label: "How paper trading works", to: "/rules" },
      { label: "Fee schedule", to: "/fees" },
      { label: "API reference", to: "/api" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
] as const;

export default function MarketingFooter() {
  return (
    <footer
      data-mkt="footer"
      className="border-t border-[var(--card-border)] bg-[var(--mkt-ink-1000)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-20">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center" aria-label="Pioni home">
              <img
                src="/logo.svg"
                alt="Pioni"
                className="marketing-logo marketing-logo--footer"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              Paper trading with live market data.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {column.heading}
              </h3>
              <nav
                className="mt-4 flex flex-col gap-2.5 text-sm"
                aria-label={column.heading}
              >
                {column.links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[var(--text-primary)] hover:opacity-70"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-[var(--card-border)] pt-7 text-xs leading-relaxed text-[var(--text-muted)]">
          <p className="max-w-3xl">
            Balances, fills, and fees are simulated. Pioni is not a broker.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Pioni. Not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
