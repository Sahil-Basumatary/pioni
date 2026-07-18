import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  applyLayoutPreset,
  LAYOUT_PRESETS,
  readLayoutPreset,
  type LayoutPresetId,
} from "../../features/trading/layoutStorage";
import { LayoutAddIcon } from "./shellIcons";

const TRADE_PATHS = new Set(["/trading", "/trade/margin", "/trade/futures"]);

export default function LayoutsMenu() {
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LayoutPresetId>(() => readLayoutPreset());
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 220) });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  function choose(id: LayoutPresetId) {
    applyLayoutPreset(id);
    setActive(id);
    setOpen(false);
    if (!TRADE_PATHS.has(pathname)) {
      navigate("/trading");
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Layouts"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="rail-icon hidden h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)] md:inline-flex"
      >
        <LayoutAddIcon className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[80] w-[220px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
          >
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Layouts
            </p>
            {(Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]).map((id) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => choose(id)}
                className={`rail-icon flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  active === id
                    ? "bg-black/[0.06] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
                }`}
              >
                {LAYOUT_PRESETS[id].label}
                {active === id ? <span className="text-[10px]">Active</span> : null}
              </button>
            ))}
            <div className="my-1 border-t border-[var(--card-border)]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => choose("advanced")}
              className="rail-icon flex w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
            >
              Reset layout
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
