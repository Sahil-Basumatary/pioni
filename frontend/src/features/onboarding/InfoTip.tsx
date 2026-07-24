import { useEffect, useId, useRef, useState } from "react";
import { GLOSSARY, type GlossaryTermId } from "./glossary";

type Placement = "top" | "bottom";

type InfoTipProps = {
  term: GlossaryTermId;
  label?: string;
  className?: string;
  placement?: Placement;
};

function prefersHover(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export default function InfoTip({
  term,
  label,
  className = "",
  placement = "top",
}: InfoTipProps) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const title = label ?? entry.title;
  const hoverMode = prefersHover();

  useEffect(() => {
    if (!open || hoverMode) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, hoverMode]);

  useEffect(() => {
    if (!open || !hoverMode) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hoverMode]);

  return (
    <span
      ref={rootRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={() => {
        if (hoverMode) setOpen(true);
      }}
      onMouseLeave={() => {
        if (hoverMode) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => {
          if (!hoverMode) setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className={`max-w-full truncate text-left text-[rgb(104,107,130)] underline decoration-dashed underline-offset-4 hover:text-[var(--text-primary)] ${className}`}
      >
        {title}
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute left-0 z-30 w-[min(240px,calc(100vw-2rem))] whitespace-normal break-words rounded-xl border border-[var(--card-border)] bg-white p-3 text-left font-normal normal-case tracking-normal shadow-[0_8px_28px_rgba(0,0,0,0.14)] ${
            placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <span className="block text-xs font-medium normal-case tracking-normal text-[var(--text-primary)]">
            {entry.title}
          </span>
          <span className="mt-1 block text-xs font-normal leading-relaxed tracking-normal text-[rgb(72,75,94)] normal-case">
            {entry.body}
          </span>
        </span>
      ) : null}
    </span>
  );
}
