import { useMemo, useState } from "react";
import { useGetOrderBookQuery, type PriceLevel } from "../orders/ordersApi";
import { useLiveMarketTrade } from "../market/liveMarketStore";

const GROUPINGS = [0.01, 0.1, 1, 10, 100] as const;

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
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(5);
}

function groupLevels(levels: PriceLevel[], step: number, side: "bid" | "ask"): PriceLevel[] {
  if (!levels.length || step <= 0) return levels;
  const buckets = new Map<number, number>();
  for (const level of levels) {
    const price = Number(level.price);
    const qty = Number(level.total_quantity);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) continue;
    const key =
      side === "bid"
        ? Math.floor(price / step) * step
        : Math.ceil(price / step) * step;
    buckets.set(key, (buckets.get(key) ?? 0) + qty);
  }
  const grouped = [...buckets.entries()].map(([price, total_quantity]) => ({
    price: String(price),
    total_quantity: String(total_quantity),
  }));
  grouped.sort((a, b) =>
    side === "ask" ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price),
  );
  return grouped;
}

export default function OrderBookPanel({ symbol }: { symbol: string }) {
  const [groupIdx, setGroupIdx] = useState(1);
  const step = GROUPINGS[groupIdx] ?? 0.1;
  const { data, isLoading, isError, refetch } = useGetOrderBookQuery(
    { symbol, depth: 12 },
    { pollingInterval: 3000 },
  );
  const trade = useLiveMarketTrade(symbol);
  const lastPrice = trade ? Number(trade.price) : null;

  const asks = useMemo(() => {
    const raw = data?.asks ?? [];
    return groupLevels(raw, step, "ask").reverse();
  }, [data?.asks, step]);
  const bids = useMemo(() => {
    const raw = data?.bids ?? [];
    return groupLevels(raw, step, "bid");
  }, [data?.bids, step]);
  const maxQty = useMemo(() => {
    const all = [...asks, ...bids].map((l) => Number(l.total_quantity));
    return Math.max(0, ...all.filter(Number.isFinite), 0);
  }, [asks, bids]);

  const spread = data?.spread != null ? Number(data.spread) : null;
  const mid =
    data?.best_bid != null && data?.best_ask != null
      ? (Number(data.best_bid) + Number(data.best_ask)) / 2
      : null;
  const spreadPct =
    spread != null && mid != null && mid > 0 ? (spread / mid) * 100 : null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--card-border)] px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Decrease grouping"
            disabled={groupIdx <= 0}
            onClick={() => setGroupIdx((i) => Math.max(0, i - 1))}
            className="rail-icon flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Order book grouping"
            className="rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--text-primary)]"
          >
            {step}
          </button>
          <button
            type="button"
            aria-label="Increase grouping"
            disabled={groupIdx >= GROUPINGS.length - 1}
            onClick={() => setGroupIdx((i) => Math.min(GROUPINGS.length - 1, i + 1))}
            className="rail-icon flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] disabled:opacity-40"
          >
            +
          </button>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          {spread != null
            ? `Spread ${formatPx(spread)}${
                spreadPct != null ? ` (${spreadPct.toFixed(4)}%)` : ""
              }`
            : "Spread —"}
        </span>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>Price</span>
        <span className="text-right">Quantity</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2">
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
          <p className="px-3 py-8 text-center text-xs leading-relaxed text-[var(--text-muted)]">
            Waiting for market depth. Synthetic maker liquidity seeds once the orders
            service is online.
          </p>
        ) : (
          <>
            <div className="flex flex-col">
              {asks.map((level) => (
                <BookRow
                  key={`a-${level.price}`}
                  level={level}
                  side="ask"
                  maxQty={maxQty}
                />
              ))}
            </div>
            <div className="my-1 flex flex-col gap-0.5 rounded-lg bg-black/[0.04] px-2 py-1.5">
              <span
                className={`text-sm font-semibold tabular-nums ${
                  lastPrice != null ? "text-emerald-600" : "text-[var(--text-muted)]"
                }`}
              >
                {lastPrice != null ? formatPx(lastPrice) : "—"}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {spread != null
                  ? `Spread: ${formatPx(spread)}${
                      spreadPct != null ? ` (${spreadPct.toFixed(4)}%)` : ""
                    }`
                  : "Spread: —"}
              </span>
            </div>
            <div className="flex flex-col">
              {bids.map((level) => (
                <BookRow
                  key={`b-${level.price}`}
                  level={level}
                  side="bid"
                  maxQty={maxQty}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function BookRow({
  level,
  side,
  maxQty,
}: {
  level: PriceLevel;
  side: "bid" | "ask";
  maxQty: number;
}) {
  const qty = Number(level.total_quantity);
  const pct = maxQty > 0 && Number.isFinite(qty) ? Math.min(100, (qty / maxQty) * 100) : 0;
  const isBid = side === "bid";
  return (
    <div className="relative grid grid-cols-2 gap-2 px-2 py-0.5 text-xs tabular-nums">
      <div
        className={`pointer-events-none absolute inset-y-0 ${
          isBid ? "left-0 bg-emerald-500/15" : "right-0 bg-rose-500/15"
        }`}
        style={{ width: `${pct}%` }}
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
    </div>
  );
}
