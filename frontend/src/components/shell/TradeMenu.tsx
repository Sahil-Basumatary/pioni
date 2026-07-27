import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  groupContainsPath,
  groupDefaultTo,
  isPathActive,
  type NavGroupItem,
} from "./navConfig";
import { useLanguage } from "../../features/auth/LanguageProvider";

type MenuPos = { top: number; left: number };

export default function TradeMenu({
  item,
  variant = "nav",
}: {
  item: NavGroupItem;
  variant?: "nav" | "topbar";
}) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const keepOpenAfterNav = useRef(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });
  const active = groupContainsPath(item, location.pathname);
  const defaultTo = groupDefaultTo(item);

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }

  function onTradeClick() {
    if (!isPathActive(location.pathname, defaultTo)) {
      keepOpenAfterNav.current = true;
      navigate(defaultTo);
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReposition() {
      placeMenu();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (keepOpenAfterNav.current) {
      keepOpenAfterNav.current = false;
      return;
    }
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onTradeClick}
        className={
          variant === "topbar"
            ? `rail-icon inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                open
                  ? "bg-black/[0.06] text-[var(--text-primary)]"
                  : "bg-transparent text-[var(--text-primary)] hover:bg-black/[0.04]"
              }`
            : `rail-icon inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active || open
                  ? "!bg-[var(--accent)] !text-white hover:!bg-[var(--accent-soft)]"
                  : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
              }`
        }
      >
        {t(item.labelKey)}
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
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[80] min-w-[180px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
          >
            {item.children.map((child) => (
              <NavLink
                key={child.id}
                to={child.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--bg)] font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
                  }`
                }
              >
                <span>{t(child.labelKey)}</span>
                {child.badge && (
                  <span className="rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {child.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
