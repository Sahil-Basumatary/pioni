import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { DotsIcon } from "./shellIcons";

export type AppEntry =
  | {
      id: string;
      title: string;
      description: string;
      kind: "external";
      href: string;
    }
  | {
      id: string;
      title: string;
      description: string;
      kind: "internal";
      href: string;
    }
  | {
      id: string;
      title: string;
      description: string;
      kind: "soon";
    };

export const APP_ENTRIES: AppEntry[] = [
  {
    id: "marketing",
    title: "Pioni",
    description: "Explore markets and get started",
    kind: "external",
    href: "https://pioni.ai",
  },
  {
    id: "trade",
    title: "Paper trading",
    description: "Spot, margin, yield, and futures",
    kind: "internal",
    href: "/trading",
  },
  {
    id: "desktop",
    title: "Desktop",
    description: "Coming soon",
    kind: "soon",
  },
];

export function AppSwitcherMenu({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div role="menu" className={className}>
      {APP_ENTRIES.map((entry) => {
        const current = entry.kind === "internal";
        const rowClass = `flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors ${
          current
            ? "bg-black/[0.06]"
            : entry.kind === "soon"
              ? ""
              : "hover:bg-black/[0.04]"
        }`;
        const body = (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]">
              <img src="/logo.svg" alt="" className="h-5 brightness-0 invert" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                {entry.title}
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                {entry.description}
              </span>
            </span>
          </>
        );
        if (entry.kind === "external") {
          return (
            <a
              key={entry.id}
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              onClick={onNavigate}
              className={rowClass}
            >
              {body}
            </a>
          );
        }
        if (entry.kind === "internal") {
          return (
            <Link
              key={entry.id}
              to={entry.href}
              role="menuitem"
              onClick={onNavigate}
              className={rowClass}
              aria-current={current ? "page" : undefined}
            >
              {body}
            </Link>
          );
        }
        return (
          <button
            key={entry.id}
            type="button"
            role="menuitem"
            disabled
            aria-disabled="true"
            className={`${rowClass} cursor-not-allowed opacity-60 hover:bg-transparent`}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

export default function AppSwitcher() {
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 300;
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, rect.right - width),
    });
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
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", placeMenu);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", placeMenu);
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
        aria-label="App switcher"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="rail-icon inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
      >
        <DotsIcon className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            style={{ top: pos.top, left: pos.left, width: 300 }}
            className="fixed z-[80] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
          >
            <AppSwitcherMenu onNavigate={() => setOpen(false)} />
          </div>,
          document.body,
        )}
    </>
  );
}
