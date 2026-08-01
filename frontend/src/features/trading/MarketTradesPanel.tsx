import { useLiveMarketTrades } from "../market/liveMarketStore";
import type { Trade } from "../../types/market";
import { useLanguage } from "../auth/LanguageProvider";

export function formatTapePrice(raw: string | number): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

export function formatTapeQty(raw: string | number): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1) return n.toFixed(5);
  return n.toFixed(8);
}

export function formatTapeTime(ts: number): string {
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

export function tapeSide(trade: Trade): "buy" | "sell" {
  return trade.buyer_maker ? "sell" : "buy";
}

export default function MarketTradesPanel({ symbol }: { symbol: string }) {
  const { t } = useLanguage();
  const trades = useLiveMarketTrades(symbol);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card-bg)]">
      <div className="grid shrink-0 grid-cols-[0.7fr_1.1fr_1.1fr_1fr] gap-2 border-b border-[var(--card-border)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
        <span>{t("tradeSide")}</span>
        <span className="text-right">{t("tradePrice")}</span>
        <span className="text-right">{t("tradeQuantity")}</span>
        <span className="text-right">{t("tradeTime")}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {trades.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
            {t("tradeWaitingTrades")}
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
  const { t } = useLanguage();
  const side = tapeSide(trade);
  const isBuy = side === "buy";
  const tone = isBuy ? "text-emerald-600" : "text-rose-500";
  return (
    <li className="grid h-[22px] grid-cols-[0.7fr_1.1fr_1.1fr_1fr] items-center gap-2 px-2 text-[11px] tabular-nums">
      <span className={tone}>{isBuy ? t("tradeBuy") : t("tradeSell")}</span>
      <span className={`text-right ${tone}`}>{formatTapePrice(trade.price)}</span>
      <span className="text-right text-[var(--text-primary)]">
        {formatTapeQty(trade.quantity)}
      </span>
      <span className="text-right text-[var(--text-muted)]">
        {formatTapeTime(trade.timestamp)}
      </span>
    </li>
  );
}
