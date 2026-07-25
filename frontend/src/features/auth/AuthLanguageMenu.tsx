import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownSmallIcon,
  GlobeIcon,
} from "../../components/shell/shellIcons";
import {
  languageLabel,
  LANGUAGE_OPTIONS,
  type AppLanguage,
} from "../settings/regionalPrefs";
import { useLanguage } from "./LanguageProvider";

export default function AuthLanguageMenu() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  function placeMenu() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 218;
    const left = Math.min(r.right - width, window.innerWidth - width - 12);
    const top = r.bottom + 6;
    const maxHeight = Math.min(430, window.innerHeight - top - 12);
    setMenuPos({ top, left: Math.max(12, left), width, maxHeight });
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    function onDoc(e: MouseEvent) {
      const tNode = e.target as Node;
      if (triggerRef.current?.contains(tNode) || menuRef.current?.contains(tNode))
        return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      placeMenu();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function selectLanguage(next: AppLanguage) {
    setLanguage(next);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[rgba(104,107,130,0.08)] px-2 text-xs font-medium text-[#686B82] hover:bg-[rgba(104,107,130,0.12)] hover:text-[#101114]"
      >
        <GlobeIcon className="size-4 shrink-0" />
        {languageLabel(language)}
        <ChevronDownSmallIcon
          className={`size-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={t("language")}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                maxHeight: menuPos.maxHeight,
              }}
              className="z-[120] overflow-y-auto rounded-xl border border-[rgba(104,107,130,0.08)] bg-white p-1 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.15)]"
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
                    className={`flex h-[38px] w-full items-center rounded-lg px-2 text-left text-base transition ${
                      active
                        ? "bg-[rgba(104,107,130,0.08)] text-[#101114]"
                        : "text-[#686B82] hover:bg-[rgba(104,107,130,0.08)] hover:text-[#101114]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
