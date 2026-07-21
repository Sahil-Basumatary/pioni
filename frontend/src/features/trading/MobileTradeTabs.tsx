import { useEffect, useRef, useState, type ReactNode } from "react";
import { SettingsSliderHorizontalIcon } from "../../components/shell/shellIcons";

export type MobileTradeTab = {
  id: string;
  label: string;
};

type MobileTradeTabsProps = {
  tabs: MobileTradeTab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function MobileTradeTabs({ tabs, activeId, onChange }: MobileTradeTabsProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOptionsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [optionsOpen]);

  return (
    <div ref={rootRef} className="relative mb-2 mt-1 flex min-h-min overflow-hidden pr-2">
      <div className="relative mx-2 min-w-0 flex-1 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border border-[var(--text-primary)] bg-[var(--card-bg)] text-[var(--text-primary)]"
                    : "border border-transparent bg-black/[0.08] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Options"
        aria-expanded={optionsOpen}
        onClick={() => setOptionsOpen((v) => !v)}
        className="rail-icon mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.08] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <SettingsSliderHorizontalIcon className="h-4 w-4" />
      </button>
      {optionsOpen && (
        <div className="absolute right-2 top-8 z-20 min-w-[160px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]">
          <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
            Widget layout options unlock in a later pass.
          </p>
        </div>
      )}
    </div>
  );
}

export function MobilePanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
      {children}
    </div>
  );
}
