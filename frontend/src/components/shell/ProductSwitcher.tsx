import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  groupContainsPath,
  groupDefaultTo,
  isPathActive,
  visibleProductNav,
  type NavItem,
} from "./navConfig";
import type { ShellMessageKey } from "../../features/i18n/shellCatalog";
import { useLanguage } from "../../features/auth/LanguageProvider";

type MenuPos = { top: number; left: number };

type FlatLink = { id: string; labelKey: ShellMessageKey; to: string };

function flattenNav(items: NavItem[]): FlatLink[] {
  const out: FlatLink[] = [];
  for (const item of items) {
    if (item.kind === "link") {
      out.push({ id: item.id, labelKey: item.labelKey, to: item.to });
      continue;
    }
    out.push({
      id: item.id,
      labelKey: item.labelKey,
      to: groupDefaultTo(item),
    });
    const prop = item.children.find((child) => child.id === "prop");
    if (prop) {
      out.push({ id: prop.id, labelKey: prop.labelKey, to: prop.to });
    }
  }
  return out;
}

export function resolveCompactNavLabelKey(
  pathname: string,
  isSignedIn: boolean,
): ShellMessageKey {
  for (const item of visibleProductNav(isSignedIn)) {
    if (item.kind === "link" && isPathActive(pathname, item.to)) {
      return item.labelKey;
    }
    if (item.kind === "group" && groupContainsPath(item, pathname)) {
      const prop = item.children.find((child) => child.id === "prop");
      if (prop && isPathActive(pathname, prop.to)) return prop.labelKey;
      return item.labelKey;
    }
  }
  if (pathname.startsWith("/otc")) return "navOtc";
  if (pathname.startsWith("/deposit")) return isSignedIn ? "navHome" : "navTrade";
  return isSignedIn ? "navHome" : "navTrade";
}

export default function ProductSwitcher() {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { t } = useLanguage();
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });
  const signedIn = Boolean(isSignedIn);
  const menuLinks = useMemo(
    () => flattenNav(visibleProductNav(signedIn)),
    [signedIn],
  );
  const labelKey = resolveCompactNavLabelKey(location.pathname, signedIn);
  const label = t(labelKey);

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
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
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-tour="sentiment-nav"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`rail-icon inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
          open
            ? "bg-black/[0.06] text-[var(--text-primary)]"
            : "bg-transparent text-[var(--text-primary)] hover:bg-black/[0.04]"
        }`}
      >
        {label}
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
            {menuLinks.map((item) => {
              const itemLabel = t(item.labelKey);
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive || label === itemLabel
                        ? "bg-[var(--bg)] font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
                    }`
                  }
                >
                  {itemLabel}
                </NavLink>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
