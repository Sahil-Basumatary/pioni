import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  CloseSmallIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusSmallIcon,
  SettingsSliderHorizontalIcon,
} from "../../components/shell/shellIcons";

export type ContentTab = {
  id: string;
  label: string;
  closable?: boolean;
};

export type MenuItem = {
  id: string;
  label: string;
};

type ContentWindowProps = {
  label: string;
  tabs: ContentTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;
  overflowItems?: MenuItem[];
  addItems?: MenuItem[];
  onMenuSelect?: (id: string) => void;
  toolbar?: ReactNode;
  headerEnd?: ReactNode;
  maximized: boolean;
  onMaximizeToggle: () => void;
  children: ReactNode;
  className?: string;
};

const iconBtn =
  "rail-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-secondary)]";

export default function ContentWindow({
  label,
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  overflowItems = [],
  addItems = [],
  onMenuSelect,
  toolbar,
  headerEnd,
  maximized,
  onMaximizeToggle,
  children,
  className = "",
}: ContentWindowProps) {
  const [menu, setMenu] = useState<"add" | "overflow" | "options" | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menu) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  function pick(id: string) {
    onMenuSelect?.(id);
    setMenu(null);
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] ${className}`}
    >
      <header className="flex h-8 shrink-0 items-center gap-0.5 border-b border-[var(--card-border)] px-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`group flex shrink-0 items-center rounded-md ${
                  active
                    ? "bg-black/[0.08] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className="rail-icon px-2 py-1 text-[12px] font-medium leading-none"
                >
                  {tab.label}
                </button>
                {tab.closable && onTabClose && (
                  <button
                    type="button"
                    aria-label={`Close ${tab.label}`}
                    onClick={() => onTabClose(tab.id)}
                    className={`rail-icon me-0.5 flex h-5 w-5 items-center justify-center rounded ${
                      active ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <CloseSmallIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {overflowItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                aria-label={`+${overflowItems.length} more widgets`}
                aria-expanded={menu === "overflow"}
                aria-controls={menuId}
                onClick={() => setMenu((m) => (m === "overflow" ? null : "overflow"))}
                className="rail-icon rounded-md px-1.5 py-1 text-[12px] font-medium leading-none text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                +{overflowItems.length}
              </button>
              {menu === "overflow" && (
                <MenuBox id={menuId} items={overflowItems} onSelect={pick} />
              )}
            </div>
          )}
          {addItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                aria-label="Add widget"
                aria-expanded={menu === "add"}
                aria-controls={menuId}
                onClick={() => setMenu((m) => (m === "add" ? null : "add"))}
                className={iconBtn}
              >
                <PlusSmallIcon className="h-4 w-4" />
              </button>
              {menu === "add" && (
                <MenuBox id={menuId} items={addItems} onSelect={pick} />
              )}
            </div>
          )}
        </div>
        {toolbar && (
          <div className="flex shrink-0 items-center gap-0.5">{toolbar}</div>
        )}
        {headerEnd}
        <div className="relative flex shrink-0 items-center gap-0">
          <button
            type="button"
            aria-label={maximized ? "Restore" : "Maximize"}
            title={maximized ? "Restore" : "Maximize"}
            onClick={onMaximizeToggle}
            className={iconBtn}
          >
            {maximized ? (
              <MinimizeIcon className="h-4 w-4" />
            ) : (
              <MaximizeIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label="Options"
            aria-expanded={menu === "options"}
            onClick={() => setMenu((m) => (m === "options" ? null : "options"))}
            className={iconBtn}
          >
            <SettingsSliderHorizontalIcon className="h-4 w-4" />
          </button>
          {menu === "options" && (
            <div
              role="menu"
              className="absolute end-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]"
            >
              <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
                Pane options coming soon
              </p>
            </div>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function MenuBox({
  id,
  items,
  onSelect,
}: {
  id: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div
      id={id}
      role="menu"
      className="absolute start-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => onSelect(item.id)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-black/[0.04]"
        >
          <span>{item.label}</span>
          <span className="text-[10px] text-[var(--text-muted)]">Soon</span>
        </button>
      ))}
    </div>
  );
}
