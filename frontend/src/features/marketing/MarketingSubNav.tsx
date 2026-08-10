import { MARKETING_SECTIONS, MARKETING_SECTION_IDS } from "./marketingSections";
import { useActiveSection } from "./useActiveSection";

export default function MarketingSubNav() {
  const activeId = useActiveSection(MARKETING_SECTION_IDS);

  return (
    <nav
      data-mkt="subnav"
      className="sticky top-16 z-10 border-b border-[var(--card-border)] bg-[var(--mkt-scrim)] backdrop-blur-sm lg:hidden"
      aria-label="Page sections"
    >
      <div className="flex w-full gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MARKETING_SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[15px] font-semibold transition-colors duration-200 ${
                isActive
                  ? "border-transparent bg-[var(--mkt-cta-bg)] text-[var(--mkt-cta-fg)]"
                  : "border-[var(--card-border)] bg-[var(--mkt-ink-850)] text-[var(--text-muted)]"
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
