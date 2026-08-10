import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "../auth/authRoutes";
import { MARKETING_SECTIONS, MARKETING_SECTION_IDS } from "./marketingSections";
import { useActiveSection } from "./useActiveSection";

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export default function MarketingHeader() {
  const activeId = useActiveSection(MARKETING_SECTION_IDS);
  const scrolled = useScrolled();

  return (
    <header
      data-mkt="header"
      className={`sticky top-0 z-20 h-16 shrink-0 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-[var(--card-border)] bg-[var(--mkt-scrim-scrolled)] shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
          : "border-transparent bg-[var(--mkt-scrim)] backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <div className="flex flex-1 items-center">
          <Link to="/" className="flex items-center" aria-label="Pioni home">
            <img
              src="/logo.svg"
              alt="Pioni"
              className="marketing-logo marketing-logo--header"
            />
          </Link>
        </div>

        <nav
          aria-label="Page sections"
          className="hidden h-full shrink-0 items-center lg:flex"
        >
          {MARKETING_SECTIONS.map((section) => {
            const isActive = activeId === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative flex h-full items-center px-3.5 text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {section.label}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-3.5 bottom-0 h-[2px] origin-center rounded-full bg-[var(--text-primary)] transition-transform duration-300 ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <Link
            to={SIGN_IN_PATH}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Sign in
          </Link>
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--mkt-cta-bg)] px-4 text-sm font-medium text-[var(--mkt-cta-fg)] transition-opacity hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}
