import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownSmallIcon } from "../../components/shell/shellIcons";

export type SettingsSelectOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsSelectProps<T extends string> = {
  value: T;
  options: readonly SettingsSelectOption<T>[] | SettingsSelectOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M13.2 4.2 6.5 11.1 2.8 7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SettingsSelect<T extends string>({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
  className = "",
}: SettingsSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  function placeMenu() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 280);
    const left = Math.min(r.left, window.innerWidth - width - 12);
    const below = r.bottom + 6;
    const estimated = Math.min(options.length * 36 + 16, 320);
    const top =
      below + estimated > window.innerHeight - 12
        ? Math.max(12, r.top - estimated - 6)
        : below;
    setMenuPos({ top, left: Math.max(12, left), width });
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
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
  }, [open, options.length]);

  return (
    <div className={`relative mt-2 w-full max-w-md ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[8px] border border-[rgba(28,19,1,0.11)] bg-white px-2.5 text-left text-sm text-[#2C2C2B] shadow-[0_1px_2px_rgba(25,25,25,0.04)] outline-none transition hover:bg-[#F9F8F7] focus-visible:border-[rgba(28,19,1,0.22)] focus-visible:shadow-[0_0_0_3px_rgba(42,28,0,0.08)]"
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <ChevronDownSmallIcon
          className={`h-4 w-4 shrink-0 text-[#787774] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
              }}
              className="z-[120] max-h-[320px] overflow-y-auto rounded-[10px] border border-[rgba(42,28,0,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(25,25,25,0.18),0_4px_12px_rgba(25,25,25,0.08),0_0_0_1px_rgba(42,28,0,0.06)]"
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 text-left text-sm transition ${
                      active
                        ? "bg-[rgba(42,28,0,0.07)] font-medium text-[#2C2C2B]"
                        : "text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
                    }`}
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {active ? (
                      <CheckIcon className="shrink-0 text-[#2C2C2B]" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
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
