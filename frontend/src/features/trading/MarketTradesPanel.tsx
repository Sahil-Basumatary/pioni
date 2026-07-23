import { useLiveMarketTrades } from "../market/liveMarketStore";
import type { Trade } from "../../types/market";

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
  if (n >= 1) return n.toFixed(5);
  return n.toFixed(8);
}

function formatTime(ts: number): string {
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function MarketTradesPanel({ symbol }: { symbol: string }) {
  const trades = useLiveMarketTrades(symbol);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card-bg)]">
      <div className="grid shrink-0 grid-cols-3 gap-2 px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
        <span>Price</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Time</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {trades.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
            Waiting for trades…
          </p>
        ) : (
          <ul>
            {trades.map((trade, index) => (
              <TradeRow
                key={`${trade.timestamp}-${trade.price}-${trade.quantity}-${index}`}
                trade={trade}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isBuy = !trade.buyer_maker;
  return (
    <li className="grid h-[22px] grid-cols-3 items-center gap-2 px-2 text-[11px] tabular-nums">
      <span className={isBuy ? "text-emerald-600" : "text-rose-500"}>
        {formatPx(trade.price)}
      </span>
      <span className="text-right text-[var(--text-primary)]">{formatQty(trade.quantity)}</span>
      <span className="text-right text-[var(--text-muted)]">{formatTime(trade.timestamp)}</span>
    </li>
  );
}
