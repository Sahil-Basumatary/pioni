import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  CloseSmallIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusSmallIcon,
  SettingsSliderHorizontalIcon,
} from "../../components/shell/shellIcons";
import { fitTabIds } from "./fitTabIds";

export type ContentTab = {
  id: string;
  label: string;
  closable?: boolean;
};

export type MenuItem = {
  id: string;
  label: string;
  soon?: boolean;
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
  "rail-icon flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-secondary)]";

const TAB_OVERFLOW_BTN_W = 36;

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
  const [menu, setMenu] = useState<"add" | "overflow" | "options" | "tabs" | null>(
    null,
  );
  const [visibleIds, setVisibleIds] = useState<string[]>(() => tabs.map((t) => t.id));
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const rootRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const tabOverflowBtnRef = useRef<HTMLButtonElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const optionsBtnRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menu) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuPanelRef.current?.contains(target)) return;
      setMenu(null);
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

  useLayoutEffect(() => {
    const strip = stripRef.current;
    const measure = measureRef.current;
    if (!strip || !measure) return;

    function recompute() {
      if (!strip || !measure) return;
      const nodes = [...measure.querySelectorAll<HTMLElement>("[data-measure-tab]")];
      const sized = tabs.map((tab) => {
        const node = nodes.find((n) => n.dataset.measureTab === tab.id);
        return { id: tab.id, width: node?.offsetWidth ?? 72 };
      });
      const fit = fitTabIds(
        sized,
        activeTabId,
        strip.clientWidth,
        TAB_OVERFLOW_BTN_W,
      );
      setVisibleIds(fit.visibleIds);
      setHiddenIds(fit.hiddenIds);
    }

    recompute();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(strip);
    return () => ro.disconnect();
  }, [tabs, activeTabId, overflowItems.length, addItems.length, Boolean(toolbar), Boolean(headerEnd)]);

  function pick(id: string) {
    onMenuSelect?.(id);
    setMenu(null);
  }

  const visibleTabs = visibleIds
    .map((id) => tabs.find((t) => t.id === id))
    .filter((t): t is ContentTab => Boolean(t));
  const hiddenTabs = hiddenIds
    .map((id) => tabs.find((t) => t.id === id))
    .filter((t): t is ContentTab => Boolean(t));

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] ${className}`}
    >
      <header className="flex h-8 shrink-0 items-center gap-0.5 border-b border-[var(--card-border)] px-1">
        <div ref={stripRef} className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
          {visibleTabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`group flex shrink-0 items-center rounded ${
                  active
                    ? "bg-black/[0.06] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className="rail-icon whitespace-nowrap px-2 py-1 text-[12px] font-medium leading-none"
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
          {hiddenTabs.length > 0 && (
            <button
              ref={tabOverflowBtnRef}
              type="button"
              aria-label={`${hiddenTabs.length} more tabs`}
              aria-expanded={menu === "tabs"}
              aria-controls={menuId}
              onClick={() => setMenu((m) => (m === "tabs" ? null : "tabs"))}
              className="rail-icon flex h-6 shrink-0 items-center justify-center rounded px-1.5 text-[12px] font-medium leading-none text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-secondary)]"
            >
              ···
            </button>
          )}
        </div>
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] top-0 flex h-8 items-center gap-0.5 opacity-0"
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              data-measure-tab={tab.id}
              className="flex shrink-0 items-center rounded"
            >
              <span className="whitespace-nowrap px-2 py-1 text-[12px] font-medium leading-none">
                {tab.label}
              </span>
              {tab.closable ? <span className="me-0.5 h-5 w-5" /> : null}
            </div>
          ))}
        </div>
        {overflowItems.length > 0 && (
          <button
            ref={overflowBtnRef}
            type="button"
            aria-label={`+${overflowItems.length} more widgets`}
            aria-expanded={menu === "overflow"}
            aria-controls={menuId}
            onClick={() => setMenu((m) => (m === "overflow" ? null : "overflow"))}
            className="rail-icon shrink-0 whitespace-nowrap rounded px-1.5 py-1 text-[12px] font-medium leading-none text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            +{overflowItems.length}
          </button>
        )}
        {addItems.length > 0 && (
          <button
            ref={addBtnRef}
            type="button"
            aria-label="Add widget"
            aria-expanded={menu === "add"}
            aria-controls={menuId}
            onClick={() => setMenu((m) => (m === "add" ? null : "add"))}
            className={iconBtn}
          >
            <PlusSmallIcon className="h-4 w-4" />
          </button>
        )}
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
            ref={optionsBtnRef}
            type="button"
            aria-label="Options"
            aria-expanded={menu === "options"}
            onClick={() => setMenu((m) => (m === "options" ? null : "options"))}
            className={iconBtn}
          >
            <SettingsSliderHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {menu === "tabs" && (
        <MenuBox
          id={menuId}
          items={hiddenTabs.map((t) => ({ id: t.id, label: t.label, soon: false }))}
          onSelect={(id) => {
            onTabChange(id);
            setMenu(null);
          }}
          anchorRef={tabOverflowBtnRef}
          panelRef={menuPanelRef}
        />
      )}
      {menu === "overflow" && (
        <MenuBox
          id={menuId}
          items={overflowItems}
          onSelect={pick}
          anchorRef={overflowBtnRef}
          panelRef={menuPanelRef}
        />
      )}
      {menu === "add" && (
        <MenuBox
          id={menuId}
          items={addItems}
          onSelect={pick}
          anchorRef={addBtnRef}
          panelRef={menuPanelRef}
        />
      )}
      {menu === "options" &&
        createPortal(
          <div
            ref={menuPanelRef}
            role="menu"
            style={anchorStyle(optionsBtnRef.current, "end")}
            className="fixed z-[80] w-52 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]"
          >
            <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
              Pane options coming soon
            </p>
          </div>,
          document.body,
        )}
    </section>
  );
}

function anchorStyle(
  el: HTMLElement | null,
  align: "start" | "end" = "start",
): { top: number; left: number } {
  if (!el) return { top: 0, left: 0 };
  const r = el.getBoundingClientRect();
  const width = 208;
  const left =
    align === "end"
      ? Math.max(8, r.right - width)
      : Math.min(r.left, window.innerWidth - width - 8);
  return { top: r.bottom + 4, left: Math.max(8, left) };
}

function MenuBox({
  id,
  items,
  onSelect,
  anchorRef,
  panelRef,
}: {
  id: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    setPos(anchorStyle(anchorRef.current, "start"));
  }, [anchorRef]);
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="menu"
      style={pos}
      className="fixed z-[80] w-52 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => onSelect(item.id)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-black/[0.04]"
        >
          <span className="whitespace-nowrap">{item.label}</span>
          {item.soon !== false && (
            <span className="text-[10px] text-[var(--text-muted)]">Soon</span>
          )}
        </button>
      ))}
    </div>,
    document.body,
  );
}
