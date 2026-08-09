import { Link } from "react-router-dom";

/* Each claim is explained in exactly one place, so this strip points at those
   places instead of restating them. */
const ITEMS = [
  { label: "Simulated funds only", to: "/rules" },
  { label: "How resets work", to: "#practice" },
  { label: "What you can trade", to: "#coverage" },
] as const;

const LINK_CLASS =
  "group inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]";

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
      <path
        d="m6 3 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MarketingIntegrityStrip() {
  return (
    <nav
      id="integrity"
      data-mkt="integrity"
      className="marketing-integrity scroll-mt-32 border-y border-[var(--card-border)]"
      aria-label="How paper trading works"
    >
      <div className="flex flex-wrap gap-x-7 gap-y-1.5 py-3">
        {ITEMS.map((item) =>
          item.to.startsWith("#") ? (
            <a key={item.label} href={item.to} className={LINK_CLASS}>
              {item.label}
              <Chevron />
            </a>
          ) : (
            <Link key={item.label} to={item.to} className={LINK_CLASS}>
              {item.label}
              <Chevron />
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
