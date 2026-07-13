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
  useResetPortfolioMutation,
  type PortfolioPosition,
} from "../portfolio/portfolioApi";
import { baseAsset } from "../../components/shell/activityFormat";
import { formatUsd } from "../../utils/formatters";

type Tab = "balances" | "positions" | "orders" | "closed";

const OPEN_STATUSES = new Set(["OPEN", "PARTIALLY_FILLED", "NEW", "PENDING"]);
const CLOSED_STATUSES = new Set([
  "FILLED",
  "CANCELLED",
  "CANCELED",
  "REJECTED",
  "EXPIRED",
]);

export default function TradingBottomPanel({ symbol }: { symbol: string }) {
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--card-border)] px-2 py-1.5">
        <TabBtn active={tab === "balances"} onClick={() => setTab("balances")} label="Balances" />
        <TabBtn
          active={tab === "positions"}
          onClick={() => setTab("positions")}
          label="Positions"
        />
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} label="Orders" />
        <TabBtn
          active={tab === "closed"}
          onClick={() => setTab("closed")}
          label="Closed orders"
        />
        {isSignedIn && <ResetChip />}
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--card-bg)]">
        {!isSignedIn ? (
          <Empty copy="Sign in from the top bar to see balances, positions, and orders." />
        ) : tab === "balances" ? (
          <BalancesTab />
        ) : tab === "positions" ? (
          <PositionsTab />
        ) : tab === "orders" ? (
          <OrdersTab symbol={symbol} mode="open" />
        ) : (
          <OrdersTab symbol={symbol} mode="closed" />
        )}
      </div>
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rail-icon rounded-lg px-2.5 py-1.5 text-xs font-medium ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function ResetChip() {
  const [resetPortfolio, { isLoading }] = useResetPortfolioMutation();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="rail-icon ml-auto rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        Reset account
      </button>
    );
  }
  return (
    <div className="ml-auto flex items-center gap-1">
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
        {isLoading ? "Resetting…" : "Confirm reset"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="rail-icon rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)]"
      >
        Cancel
      </button>
    </div>
  );
}

function BalancesTab() {
  const { data, isLoading, isError, refetch } = useGetMySummaryQuery();
  if (isLoading) return <Empty copy="Loading balances…" />;
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy="Couldn’t load balances." />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }
  const assets = (data.positions ?? []).filter((p) => Number(p.quantity) !== 0);
  return (
    <table className="w-full min-w-[480px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          <th className="px-3 py-2 font-medium">Asset</th>
          <th className="px-3 py-2 font-medium">Balance</th>
          <th className="px-3 py-2 font-medium">Value</th>
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
  const { data, isLoading, isError, refetch } = useGetMyPositionsQuery({ openOnly: true });
  const open = useMemo(
    () => (data ?? []).filter((p) => Number(p.quantity) !== 0),
    [data],
  );
  if (isLoading) return <Empty copy="Loading positions…" />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy="Couldn’t load positions." />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!open.length) {
    return <Empty copy="No open positions — place a paper trade to open one." />;
  }
  return (
    <table className="w-full min-w-[560px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          <th className="px-3 py-2 font-medium">Market</th>
          <th className="px-3 py-2 font-medium">Size</th>
          <th className="px-3 py-2 font-medium">Entry</th>
          <th className="px-3 py-2 font-medium">Mark</th>
          <th className="px-3 py-2 font-medium">Unrealized P&L</th>
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
  const { data, isLoading, isError, refetch } = useListOrdersQuery({
    symbol,
    limit: 50,
  });
  const rows = useMemo(() => {
    const list = data ?? [];
    return mode === "open"
      ? list.filter((o) => OPEN_STATUSES.has(o.status.toUpperCase()))
      : list.filter((o) => CLOSED_STATUSES.has(o.status.toUpperCase()));
  }, [data, mode]);
  if (isLoading) {
    return <Empty copy={mode === "open" ? "Loading orders…" : "Loading closed orders…"} />;
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Empty copy="Couldn’t load orders." />
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <Empty
        copy={
          mode === "open"
            ? "No open orders. Start trading"
            : "No closed orders yet."
        }
      />
    );
  }
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          <th className="px-3 py-2 font-medium">Market</th>
          <th className="px-3 py-2 font-medium">Side</th>
          <th className="px-3 py-2 font-medium">Type</th>
          <th className="px-3 py-2 font-medium">Price</th>
          <th className="px-3 py-2 font-medium">Quantity</th>
          <th className="px-3 py-2 font-medium">Filled</th>
          <th className="px-3 py-2 font-medium">Status</th>
          {mode === "open" && <th className="px-3 py-2 font-medium" />}
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
  const [cancelOrder, { isLoading }] = useCancelOrderMutation();
  const isBuy = order.side === "BUY";
  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
        {baseAsset(order.symbol)}/USD
      </td>
      <td className={`px-3 py-2 font-medium ${isBuy ? "text-emerald-600" : "text-rose-500"}`}>
        {order.side}
      </td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{order.order_type}</td>
      <td className="px-3 py-2 tabular-nums text-[var(--text-primary)]">
        {order.price != null ? formatUsd(order.price) : "Market"}
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
            {isLoading ? "…" : "Cancel"}
          </button>
        </td>
      )}
    </tr>
  );
}

function Empty({ copy }: { copy: string }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">{copy}</p>
  );
}
