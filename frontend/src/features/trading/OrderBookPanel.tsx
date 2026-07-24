import { useEffect, useMemo, useRef, useState } from "react";
import { useGetOrderBookQuery } from "../orders/ordersApi";
import { MinusSmallIcon, PlusSmallIcon } from "../../components/shell/shellIcons";
import {
  GROUPINGS,
  formatGroupStep,
  groupLevels,
  withCumulativeDepth,
  type DepthLevel,
} from "./orderBookMath";
import InfoTip from "../onboarding/InfoTip";

function formatPx(raw: string | number): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

function formatQty(raw: string | number): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(8);
}

export default function OrderBookPanel({ symbol }: { symbol: string }) {
  const [groupIdx, setGroupIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const asksRef = useRef<HTMLDivElement>(null);
  const step = GROUPINGS[groupIdx] ?? 0.1;
  const { data, isLoading, isError, refetch } = useGetOrderBookQuery(
    { symbol, depth: 50 },
    { pollingInterval: 3000 },
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const asks = useMemo(() => {
    const raw = data?.asks ?? [];
    const grouped = groupLevels(raw, step, "ask").reverse();
    return withCumulativeDepth(grouped, false);
  }, [data?.asks, step]);
  const bids = useMemo(() => {
    const raw = data?.bids ?? [];
    const grouped = groupLevels(raw, step, "bid");
    return withCumulativeDepth(grouped, true);
  }, [data?.bids, step]);

  // Keep best asks pinned to the spread (bottom of the ask pane), like Pro.
  useEffect(() => {
    const el = asksRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [asks]);

  const spread = data?.spread != null ? Number(data.spread) : null;
  const mid =
    data?.best_bid != null && data?.best_ask != null
      ? (Number(data.best_bid) + Number(data.best_ask)) / 2
      : null;
  const spreadPct =
    spread != null && mid != null && mid > 0 ? (spread / mid) * 100 : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card-bg)]">
      <div className="flex shrink-0 items-center gap-1 border-b border-[var(--card-border)] px-2 py-1">
        <InfoTip term="order_book" label="Book" className="me-1 text-[11px]" />
        <button
          type="button"
          aria-label="Decrease grouping"
          disabled={groupIdx <= 0}
          onClick={() => setGroupIdx((i) => Math.max(0, i - 1))}
          className="rail-icon flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-40"
        >
          <MinusSmallIcon className="h-4 w-4" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Order book grouping"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="min-w-[3.25rem] rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--text-primary)] hover:bg-black/[0.06]"
          >
            {formatGroupStep(step)}
          </button>
          {menuOpen && (
            <ul
              role="listbox"
              aria-label="Order book grouping"
              className="absolute start-0 top-full z-30 mt-1 max-h-56 w-20 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]"
            >
              {GROUPINGS.map((g, i) => (
                <li key={g} role="option" aria-selected={i === groupIdx}>
                  <button
                    type="button"
                    onClick={() => {
                      setGroupIdx(i);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full px-3 py-1.5 text-left text-[11px] tabular-nums ${
                      i === groupIdx
                        ? "bg-black/[0.06] font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-black/[0.04]"
                    }`}
                  >
                    {formatGroupStep(g)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          aria-label="Increase grouping"
          disabled={groupIdx >= GROUPINGS.length - 1}
          onClick={() => setGroupIdx((i) => Math.min(GROUPINGS.length - 1, i + 1))}
          className="rail-icon flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-40"
        >
          <PlusSmallIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-1 px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
        <span>Price</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-1">
        {isLoading && !data ? (
          <p className="px-2 py-8 text-center text-xs text-[var(--text-muted)]">Loading book…</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-2 py-8">
            <p className="text-xs text-[var(--text-muted)]">Couldn’t load order book.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[var(--accent)] px-2 py-1 text-[11px] font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : !asks.length && !bids.length ? (
          <p className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
            Waiting for market depth…
          </p>
        ) : (
          <>
            <div
              ref={asksRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {asks.map((level) => (
                <BookRow key={`a-${level.price}`} level={level} side="ask" />
              ))}
            </div>
            <div className="my-0.5 flex shrink-0 items-center gap-1.5 px-2 py-1.5">
              <InfoTip term="spread" className="text-[11px]" />
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                {spread != null
                  ? `${formatPx(spread)}${
                      spreadPct != null ? ` (${spreadPct.toFixed(4)}%)` : ""
                    }`
                  : "—"}
              </span>
              <InfoTip
                term="book_grouping"
                label="Grouping"
                className="ms-auto text-[11px]"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {bids.map((level) => (
                <BookRow key={`b-${level.price}`} level={level} side="bid" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BookRow({
  level,
  side,
}: {
  level: DepthLevel;
  side: "bid" | "ask";
}) {
  const isBid = side === "bid";
  return (
    <div
      className="relative grid h-[22px] shrink-0 grid-cols-3 items-center gap-1 px-2 text-xs tabular-nums"
    >
      <div
        className={`pointer-events-none absolute inset-y-0 end-0 ${
          isBid ? "bg-emerald-500/15" : "bg-rose-500/15"
        }`}
        style={{ width: `${level.depthPct}%` }}
      />
      <span
        className={`relative z-[1] truncate font-medium ${
          isBid ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        {formatPx(level.price)}
      </span>
      <span className="relative z-[1] truncate text-right text-[var(--text-primary)]">
        {formatQty(level.total_quantity)}
      </span>
      <span className="relative z-[1] truncate text-right text-[var(--text-secondary)]">
        {formatQty(level.cumQty)}
      </span>
    </div>
  );
}
