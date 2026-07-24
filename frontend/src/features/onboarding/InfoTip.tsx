import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryTermId } from "./glossary";
import { readDisplayPrefs } from "../settings/displayPrefs";

type Placement = "top" | "bottom";

type InfoTipProps = {
  term: GlossaryTermId;
  label?: string;
  className?: string;
  placement?: Placement;
};

type TipCoords = { top: number; left: number; placement: Placement };

const VIEW_PAD = 8;
const GAP = 8;
const TIP_WIDTH = 240;

function prefersHover(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function placeInfoTip(
  trigger: DOMRect,
  tipSize: { width: number; height: number },
  preferred: Placement,
  viewport = { width: window.innerWidth, height: window.innerHeight },
): TipCoords {
  const spaceAbove = trigger.top - VIEW_PAD;
  const spaceBelow = viewport.height - trigger.bottom - VIEW_PAD;
  let placement = preferred;
  if (preferred === "top" && tipSize.height > spaceAbove && spaceBelow > spaceAbove) {
    placement = "bottom";
  } else if (
    preferred === "bottom" &&
    tipSize.height > spaceBelow &&
    spaceAbove > spaceBelow
  ) {
    placement = "top";
  }
  let top =
    placement === "top" ? trigger.top - tipSize.height - GAP : trigger.bottom + GAP;
  let left = trigger.left;
  left = Math.min(
    Math.max(VIEW_PAD, left),
    Math.max(VIEW_PAD, viewport.width - tipSize.width - VIEW_PAD),
  );
  top = Math.min(
    Math.max(VIEW_PAD, top),
    Math.max(VIEW_PAD, viewport.height - tipSize.height - VIEW_PAD),
  );
  return { top, left, placement };
}

export default function InfoTip({
  term,
  label,
  className = "",
  placement = "top",
}: InfoTipProps) {
  const entry = GLOSSARY[term];
  const tipsEnabled = readDisplayPrefs().showInfoTips;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipId = useId();
  const title = label ?? entry.title;
  const hoverMode = prefersHover();

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openTip() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, 120);
  }

  function closeTip() {
    clearCloseTimer();
    setOpen(false);
  }

  useEffect(() => () => clearCloseTimer(), []);

  useLayoutEffect(() => {
    if (!open || !tipsEnabled) {
      setCoords(null);
      return;
    }
    function update() {
      const trigger = rootRef.current?.getBoundingClientRect();
      const tipEl = tipRef.current;
      if (!trigger || !tipEl) return;
      const size = {
        width: tipEl.offsetWidth || TIP_WIDTH,
        height: tipEl.offsetHeight || 80,
      };
      setCoords(placeInfoTip(trigger, size, placement));
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, placement, title, entry.body, tipsEnabled]);

  useEffect(() => {
    if (!open || !tipsEnabled) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || tipRef.current?.contains(target)) {
        return;
      }
      closeTip();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeTip();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, tipsEnabled]);

  if (!tipsEnabled) {
    return (
      <span className={`max-w-full truncate text-[rgb(104,107,130)] ${className}`}>
        {title}
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={() => {
        if (hoverMode) openTip();
      }}
      onMouseLeave={() => {
        if (hoverMode) scheduleClose();
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => {
          if (!hoverMode) setOpen((v) => !v);
        }}
        onFocus={openTip}
        onBlur={(event) => {
          const next = event.relatedTarget as Node | null;
          if (rootRef.current?.contains(next) || tipRef.current?.contains(next)) {
            return;
          }
          closeTip();
        }}
        className={`max-w-full truncate text-left text-[rgb(104,107,130)] underline decoration-dashed underline-offset-4 hover:text-[var(--text-primary)] ${className}`}
      >
        {title}
      </button>
      {open
        ? createPortal(
            <span
              ref={tipRef}
              id={tipId}
              role="tooltip"
              onMouseEnter={() => {
                if (hoverMode) openTip();
              }}
              onMouseLeave={() => {
                if (hoverMode) scheduleClose();
              }}
              style={{
                position: "fixed",
                top: coords?.top ?? -9999,
                left: coords?.left ?? -9999,
                width: `min(${TIP_WIDTH}px, calc(100vw - 2rem))`,
                visibility: coords ? "visible" : "hidden",
                zIndex: 90,
              }}
              className="whitespace-normal break-words rounded-xl border border-[var(--card-border)] bg-white p-3 text-left font-normal normal-case tracking-normal shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
            >
              <span className="block text-xs font-medium normal-case tracking-normal text-[var(--text-primary)]">
                {entry.title}
              </span>
              <span className="mt-1 block text-xs font-normal leading-relaxed tracking-normal text-[rgb(72,75,94)] normal-case">
                {entry.body}
              </span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
