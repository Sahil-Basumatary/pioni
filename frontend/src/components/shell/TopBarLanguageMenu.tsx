import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlobeIcon } from "./shellIcons";
import {
  LANGUAGE_OPTIONS,
  type AppLanguage,
} from "../../features/settings/regionalPrefs";
import { useLanguage } from "../../features/auth/LanguageProvider";

export default function TopBarLanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 430 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  function placeMenu() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 218;
    const left = Math.min(r.right - width, window.innerWidth - width - 12);
    const top = r.bottom + 6;
    setPos({
      top,
      left: Math.max(12, left),
      maxHeight: Math.min(430, window.innerHeight - top - 12),
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const node = e.target as Node;
      if (btnRef.current?.contains(node) || menuRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeMenu);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeMenu);
    };
  }, [open]);

  function selectLanguage(next: AppLanguage) {
    setLanguage(next);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="rail-icon inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
      >
        <GlobeIcon className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label="Select language"
            style={{
              top: pos.top,
              left: pos.left,
              maxHeight: pos.maxHeight,
              width: 218,
            }}
            className="fixed z-[80] overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
          >
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = opt.value === language;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selectLanguage(opt.value)}
                  className={`flex h-[38px] w-full items-center rounded-lg px-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-black/[0.06] font-medium text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
