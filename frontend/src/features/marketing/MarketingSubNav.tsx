const LINKS = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "trade", label: "Trade" },
  { id: "markets", label: "Markets" },
  { id: "practice", label: "Practice" },
  { id: "desk", label: "Desk" },
  { id: "faq", label: "FAQ" },
] as const;

export default function MarketingSubNav() {
  return (
    <nav
      data-mkt="subnav"
      className="sticky top-16 z-10 border-b border-[var(--card-border)] bg-[#F6F5F9]/92 backdrop-blur-sm"
      aria-label="Marketing sections"
    >
      <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
