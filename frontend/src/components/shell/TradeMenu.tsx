import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { groupContainsPath, type NavGroupItem } from "./navConfig";

export default function TradeMenu({ item }: { item: NavGroupItem }) {
  const location = useLocation();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const active = groupContainsPath(item, location.pathname);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          active || open
            ? "bg-[var(--accent)] text-white"
            : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
        }`}
      >
        {item.label}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
        >
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              role="menuitem"
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--bg)] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
                }`
              }
            >
              <span>{child.label}</span>
              {child.badge && (
                <span className="rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {child.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
