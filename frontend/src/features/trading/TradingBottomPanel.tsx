import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  useCancelOrderMutation,
  useListOrdersQuery,
  type Order,
} from "../orders/ordersApi";
import {
  useGetMyPositionsQuery,
  useGetMySummaryQuery,
  useGetMyTradesQuery,
  useResetPortfolioMutation,
  type PortfolioPosition,
  type PortfolioTrade,
} from "../portfolio/portfolioApi";
import { baseAsset } from "../../components/shell/activityFormat";
import { formatUsd } from "../../utils/formatters";
import SignedOutUnlock from "../auth/SignedOutUnlock";
import InfoTip from "../onboarding/InfoTip";
import TeachingEmpty from "../onboarding/TeachingEmpty";
import { useLanguage } from "../auth/LanguageProvider";

const OPEN_STATUSES = new Set(["OPEN", "PARTIALLY_FILLED", "NEW", "PENDING"]);
const CLOSED_STATUSES = new Set([
  "FILLED",
  "CANCELLED",
  "CANCELED",
  "REJECTED",
  "EXPIRED",
]);

type BottomTab = "balances" | "positions" | "orders" | "closed" | "history";

export type { BottomTab };

export default function TradingBottomPanel({
  symbol,
  tab,
}: {
  symbol: string;
  tab: BottomTab;
}) {
  return (
    <div
      data-tour="positions"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card-bg)]"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "balances" ? (
          <BalancesTab />
        ) : tab === "positions" ? (
          <PositionsTab />
        ) : tab === "orders" ? (
          <OrdersTab symbol={symbol} mode="open" />
        ) : tab === "closed" ? (
          <OrdersTab symbol={symbol} mode="closed" />
        ) : (
          <TradesTab symbol={symbol} />
        )}
      </div>
    </div>
  );
}

export function ResetAccountChip() {
  const { t } = useLanguage();
  const [resetPortfolio, { isLoading }] = useResetPortfolioMutation();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="rail-icon rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        {t("tradeResetAccount")}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          try {
            await resetPortfolio().unwrap();
          } finally {
            setConfirm(false);
          }
        }}
        className="rounded-lg bg-rose-500 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
      >
        {t(isLoading ? "tradeResetting" : "tradeConfirmReset")}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="rail-icon rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)]"
      >
        {t("tradeCancel")}
      </button>
    </div>
  );
}

function BalancesTab() {
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMySummaryQuery(undefined, {
    skip: !isSignedIn,
  });
  if (!isSignedIn) {
    return <SignedOutUnlock />;
  }
  if (isLoading) return <Empty copy={t("tradeLoadingBalances")} />;
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy={t("tradeCouldntLoadBalances")} />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  const assets = (data.positions ?? []).filter((p) => Number(p.quantity) !== 0);
  return (
    <table className="w-full min-w-[480px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[11px] text-[var(--text-muted)]">
          <th className="px-3 py-1.5 font-medium">{t("tradeAsset")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeBalance")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeValue")}</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-[var(--card-border)]">
          <td className="px-3 py-2 font-medium text-[var(--text-primary)]">USD</td>
          <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">
            {formatUsd(data.portfolio.cash_balance)}
          </td>
          <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">
            {formatUsd(data.portfolio.cash_balance)}
          </td>
        </tr>
        {assets.map((p) => {
          const qty = Number(p.quantity);
          const mark = p.market_price != null ? Number(p.market_price) : null;
          const value =
            mark != null && Number.isFinite(qty) ? formatUsd(qty * mark) : "—";
          return (
            <tr key={p.id} className="border-t border-[var(--card-border)]">
              <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                {baseAsset(p.symbol)}
              </td>
              <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">
                {p.quantity}
              </td>
              <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">{value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PositionsTab() {
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMyPositionsQuery(
    { openOnly: true },
    { skip: !isSignedIn },
  );
  const open = useMemo(
    () => (data ?? []).filter((p) => Number(p.quantity) !== 0),
    [data],
  );
  if (!isSignedIn) return <SignedOutUnlock />;
  if (isLoading) return <Empty copy={t("tradeLoadingPositions")} />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy={t("tradeCouldntLoadPositions")} />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (!open.length) return <TeachingEmpty id="positions" />;
  return (
    <table className="w-full min-w-[560px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[11px] text-[var(--text-muted)]">
          <th className="px-3 py-1.5 font-medium">{t("tradeMarketLabel")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeSize")}</th>
          <th className="px-3 py-1.5 font-medium">
            <InfoTip term="entry_price" className="text-[11px]" />
          </th>
          <th className="px-3 py-1.5 font-medium">
            <InfoTip term="mark_price" className="text-[11px]" />
          </th>
          <th className="px-3 py-1.5 font-medium">
            <InfoTip term="unrealized_pnl" className="text-[11px]" />
          </th>
        </tr>
      </thead>
      <tbody>
        {open.map((p) => (
          <PositionRow key={p.id} position={p} />
        ))}
      </tbody>
    </table>
  );
}

function PositionRow({ position }: { position: PortfolioPosition }) {
  const upnl = position.unrealized_pnl != null ? Number(position.unrealized_pnl) : null;
  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
        {baseAsset(position.symbol)}
        <span className="text-[var(--text-muted)]">/USD</span>
      </td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">{position.quantity}</td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">
        {formatUsd(position.avg_entry_price)}
      </td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">
        {position.market_price != null ? formatUsd(position.market_price) : "—"}
      </td>
      <td
        className={`px-3 py-2 font-medium tabular-nums ${
          upnl == null
            ? "text-[var(--text-muted)]"
            : upnl >= 0
              ? "text-emerald-600"
              : "text-rose-500"
        }`}
      >
        {upnl == null ? "—" : formatUsd(upnl)}
      </td>
    </tr>
  );
}

function OrdersTab({
  symbol,
  mode,
}: {
  symbol: string;
  mode: "open" | "closed";
}) {
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useListOrdersQuery(
    { symbol, limit: 50 },
    { skip: !isSignedIn },
  );
  const rows = useMemo(() => {
    const list = data ?? [];
    return mode === "open"
      ? list.filter((o) => OPEN_STATUSES.has(o.status.toUpperCase()))
      : list.filter((o) => CLOSED_STATUSES.has(o.status.toUpperCase()));
  }, [data, mode]);
  if (!isSignedIn) {
    return (
      <SignedOutUnlock />
    );
  }
  if (isLoading) {
    return (
      <Empty
        copy={t(
          mode === "open" ? "tradeLoadingOrders" : "tradeLoadingClosedOrders",
        )}
      />
    );
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <Empty copy={t("tradeCouldntLoadOrders")} />
        <p className="text-[11px] text-[var(--text-muted)]">
          {t("tradeLiveOrdersUnavailable")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <TeachingEmpty id={mode === "open" ? "open_orders" : "closed_orders"} />
    );
  }
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[11px] text-[var(--text-muted)]">
          <th className="px-3 py-1.5 font-medium">{t("tradeMarketLabel")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeSide")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeType")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradePrice")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeQuantity")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeFilledQty")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeStatus")}</th>
          {mode === "open" && <th className="px-3 py-1.5 font-medium" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((order) => (
          <OrderRow key={order.id} order={order} showCancel={mode === "open"} />
        ))}
      </tbody>
    </table>
  );
}

function OrderRow({ order, showCancel }: { order: Order; showCancel: boolean }) {
  const { t } = useLanguage();
  const [cancelOrder, { isLoading }] = useCancelOrderMutation();
  const isBuy = order.side === "BUY";
  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
        {baseAsset(order.symbol)}/USD
      </td>
      <td className={`px-3 py-2 font-medium ${isBuy ? "text-emerald-600" : "text-rose-500"}`}>
        {t(isBuy ? "tradeBuy" : "tradeSell")}
      </td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{order.order_type}</td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">
        {order.price != null ? formatUsd(order.price) : t("tradeMarket")}
      </td>
      <td className="px-3 py-2 tabular-nums">{order.quantity}</td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">{order.filled_quantity}</td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{order.status}</td>
      {showCancel && (
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => cancelOrder(order.id)}
            className="rounded-lg border border-[var(--card-border)] bg-transparent px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 disabled:opacity-50"
          >
            {isLoading ? "…" : t("tradeCancel")}
          </button>
        </td>
      )}
    </tr>
  );
}

function TradesTab({ symbol }: { symbol: string }) {
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { symbol, limit: 50 },
    { skip: !isSignedIn },
  );
  if (!isSignedIn) return <SignedOutUnlock />;
  if (isLoading) return <Empty copy={t("tradeLoadingTrades")} />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy={t("tradeCouldntLoadTrades")} />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  const rows = data ?? [];
  if (!rows.length) return <TeachingEmpty id="trades" />;
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[11px] text-[var(--text-muted)]">
          <th className="px-3 py-1.5 font-medium">{t("tradeMarketLabel")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeSide")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradePrice")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeQuantity")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeFee")}</th>
          <th className="px-3 py-1.5 font-medium">{t("tradeTime")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </tbody>
    </table>
  );
}

function TradeRow({ trade }: { trade: PortfolioTrade }) {
  const { t } = useLanguage();
  const isBuy = trade.side === "BUY";
  const when = new Date(trade.executed_at);
  const timeLabel = Number.isNaN(when.getTime())
    ? "—"
    : when.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
        {baseAsset(trade.symbol)}/USD
      </td>
      <td className={`px-3 py-2 font-medium ${isBuy ? "text-emerald-600" : "text-rose-500"}`}>
        {t(isBuy ? "tradeBuy" : "tradeSell")}
      </td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">
        {formatUsd(trade.price)}
      </td>
      <td className="px-3 py-2 tabular-nums">{trade.quantity}</td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">
        {formatUsd(trade.fee)}
      </td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{timeLabel}</td>
    </tr>
  );
}

function Empty({ copy }: { copy: string }) {
  return (
    <p className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">{copy}</p>
  );
}
