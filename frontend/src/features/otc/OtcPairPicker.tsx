import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownSmallIcon,
  SearchIcon,
} from "../../components/shell/shellIcons";
import {
  filterOtcPairs,
  type OtcPortalPair,
} from "./otcPortalContent";

const FIAT_QUOTES = new Set(["AUD", "CAD", "EUR", "GBP", "USD"]);

function OtcAssetIcon({
  asset,
  size,
  bordered,
}: {
  asset: string;
  size: 12 | 20;
  bordered?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const px = size;
  const className =
    size === 20
      ? "size-5 shrink-0 rounded-full object-scale-down"
      : "size-3 shrink-0 rounded-full object-scale-down";

  if (FIAT_QUOTES.has(asset) || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[rgba(42,42,42,0.92)] text-white ${
          size === 20 ? "size-5 text-[8px] font-semibold" : "size-3 text-[6px] font-semibold"
        } ${bordered ? "box-border border border-[rgb(222,222,229)]" : ""}`}
        aria-hidden
      >
        {asset.slice(0, size === 12 ? 1 : 1)}
      </span>
    );
  }

  return (
    <img
      src={`/icons/assets/${asset.toLowerCase()}.webp`}
      alt=""
      width={px}
      height={px}
      className={`${className} ${bordered ? "box-border border border-[rgb(222,222,229)]" : ""}`}
      onError={() => setFailed(true)}
    />
  );
}

function PairIcons({ base, quote }: { base: string; quote: string }) {
  return (
    <span className="relative inline-flex shrink-0">
      <OtcAssetIcon asset={base} size={20} />
      <span className="absolute -bottom-1 -end-1 block leading-none">
        <OtcAssetIcon asset={quote} size={12} bordered />
      </span>
    </span>
  );
}

export default function OtcPairPicker({
  pair,
  onSelect,
}: {
  pair: OtcPortalPair;
  onSelect: (next: OtcPortalPair) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => filterOtcPairs(query), [query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    queueMicrotask(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Market"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-2 rounded-xl bg-[rgba(104,107,130,0.08)] px-2 text-xs font-medium"
      >
        <OtcAssetIcon asset={pair.base} size={20} />
        <span>{pair.label}</span>
        <ChevronDownSmallIcon className="size-3.5 text-[var(--text-muted)]" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-1 flex w-[200px] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          role="presentation"
        >
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] px-2 py-1.5">
            <SearchIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              role="combobox"
              aria-label="Market"
              aria-autocomplete="list"
              aria-expanded={open}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-7 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div
            role="listbox"
            aria-label="Markets"
            className="max-h-[330px] overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-[var(--text-muted)]">
                No markets found
              </p>
            ) : (
              filtered.map((p) => {
                const selected = p.id === pair.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onSelect(p);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-black/[0.04] ${
                      selected ? "bg-black/[0.03]" : ""
                    }`}
                  >
                    <PairIcons base={p.base} quote={p.quote} />
                    <span className="min-w-0">
                      <span className="font-medium">{p.base}</span>
                      <span className="text-[var(--text-muted)]">/{p.quote}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
