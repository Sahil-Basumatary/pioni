import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  useGetMySummaryQuery,
  type PortfolioPosition,
} from "../portfolio/portfolioApi";
import { useListOrdersQuery, type Order } from "../orders/ordersApi";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";
import { PAPER_BTC_MID, PAPER_HOME_CASH } from "./paperHomeDemo";

type HoldingsTab = "balances" | "orders" | "positions";

const ASSET_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ether",
  SOL: "Solana",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  USD: "US Dollar",
  USDT: "Tether",
};

const OPEN_STATUSES = new Set(["NEW", "OPEN", "PARTIALLY_FILLED", "PENDING"]);

export default function HomeHoldingsPanel() {
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<HoldingsTab>("balances");
  const { data, isLoading } = useGetMySummaryQuery(undefined, { skip: !isSignedIn });

  return (
    <section className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex gap-1">
        <HoldingsTabChip
          label="Balances"
          active={tab === "balances"}
          onClick={() => setTab("balances")}
        />
        <HoldingsTabChip
          label="Orders"
          active={tab === "orders"}
          onClick={() => setTab("orders")}
        />
        <HoldingsTabChip
          label="Positions"
          active={tab === "positions"}
          onClick={() => setTab("positions")}
        />
      </div>
      {tab === "orders" ? (
        <OrdersTable signedIn={Boolean(isSignedIn)} />
      ) : tab === "positions" ? (
        <PositionsTable
          positions={(data?.positions ?? []).filter((p) => Number(p.quantity) !== 0)}
          loading={Boolean(isSignedIn && isLoading)}
          signedIn={Boolean(isSignedIn)}
        />
      ) : (
        <BalancesTable
          cash={data?.portfolio.cash_balance ?? null}
          positions={data?.positions ?? []}
          loading={Boolean(isSignedIn && isLoading)}
          signedIn={Boolean(isSignedIn)}
        />
      )}
    </section>
  );
}

function HoldingsTabChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rail-icon rounded-lg px-2 py-1.5 text-xs font-medium ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

type BalanceRowModel = {
  symbol: string;
  balance: number;
  avgPrice: number | null;
  currentPrice: number | null;
};

function BalancesTable({
  cash,
  positions,
  loading,
  signedIn,
}: {
  cash: string | null;
  positions: PortfolioPosition[];
  loading: boolean;
  signedIn: boolean;
}) {
  const liveBtc = useLiveMarketTrade("BTCUSDT");
  const btcMark =
    liveBtc && Number.isFinite(Number(liveBtc.price))
      ? Number(liveBtc.price)
      : PAPER_BTC_MID;

  if (signedIn && loading) return <Empty copy="Loading balances…" />;

  const cashNum = signedIn
    ? cash != null && Number.isFinite(Number(cash))
      ? Number(cash)
      : 0
    : PAPER_HOME_CASH;

  const byAsset = new Map<string, BalanceRowModel>();
  byAsset.set("USD", {
    symbol: "USD",
    balance: cashNum,
    avgPrice: 1,
    currentPrice: 1,
  });

  if (signedIn) {
    for (const p of positions) {
      const qty = Number(p.quantity);
      if (!Number.isFinite(qty) || qty === 0) continue;
      const symbol = baseAsset(p.symbol);
      const avg = Number(p.avg_entry_price);
      const mark = p.market_price != null ? Number(p.market_price) : null;
      byAsset.set(symbol, {
        symbol,
        balance: qty,
        avgPrice: Number.isFinite(avg) ? avg : null,
        currentPrice: mark != null && Number.isFinite(mark) ? mark : null,
      });
    }
  }

  if (!byAsset.has("BTC")) {
    byAsset.set("BTC", {
      symbol: "BTC",
      balance: 0,
      avgPrice: null,
      currentPrice: btcMark,
    });
  } else {
    const btc = byAsset.get("BTC")!;
    if (btc.currentPrice == null) btc.currentPrice = btcMark;
  }

  const rows = [...byAsset.values()].sort((a, b) => {
    if (a.symbol === "USD") return -1;
    if (b.symbol === "USD") return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  const sumEst = rows.reduce((acc, row) => {
    if (row.symbol === "USD") return acc + row.balance;
    if (row.currentPrice == null) return acc;
    return acc + row.balance * row.currentPrice;
  }, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="text-xs text-[var(--text-muted)]">
            <th className="px-2 py-2 font-medium">Asset</th>
            <th className="px-2 py-2 font-medium">Balance</th>
            <th className="px-2 py-2 text-right font-medium">Avg. price</th>
            <th className="px-2 py-2 text-right font-medium">Current Price</th>
            <th className="px-2 py-2 text-right font-medium">Est. value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <BalanceRow key={row.symbol} {...row} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-[var(--card-border)]">
            <td colSpan={4} className="px-2 py-3 text-right text-sm text-[var(--text-muted)]">
              Sum
            </td>
            <td className="px-2 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
              {fmtUsd(sumEst)}
              <span className="ml-1 font-normal text-[var(--text-muted)]">USD</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PositionsTable({
  positions,
  loading,
  signedIn,
}: {
  positions: PortfolioPosition[];
  loading: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) return <Empty copy="Sign in to see open positions." />;
  if (loading) return <Empty copy="Loading positions…" />;
  if (!positions.length) return <Empty copy="No open positions yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="text-xs text-[var(--text-muted)]">
            <th className="px-2 py-2 font-medium">Asset</th>
            <th className="px-2 py-2 font-medium">Balance</th>
            <th className="px-2 py-2 text-right font-medium">Avg. price</th>
            <th className="px-2 py-2 text-right font-medium">Current Price</th>
            <th className="px-2 py-2 text-right font-medium">Est. value</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const symbol = baseAsset(p.symbol);
            const qty = Number(p.quantity);
            const avg = Number(p.avg_entry_price);
            const mark = p.market_price != null ? Number(p.market_price) : null;
            return (
              <BalanceRow
                key={p.id}
                symbol={symbol}
                balance={qty}
                avgPrice={Number.isFinite(avg) ? avg : null}
                currentPrice={mark != null && Number.isFinite(mark) ? mark : null}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({ signedIn }: { signedIn: boolean }) {
  const { data, isLoading, isError, refetch } = useListOrdersQuery(
    { limit: 50 },
    { skip: !signedIn },
  );
  if (!signedIn) return <Empty copy="Sign in to see open orders." />;
  if (isLoading) return <Empty copy="Loading orders…" />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
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
  const rows = (data ?? []).filter((o) => OPEN_STATUSES.has(o.status.toUpperCase()));
  if (!rows.length) {
    return <Empty copy="No open orders — place a paper trade from Trade." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="text-xs text-[var(--text-muted)]">
            <th className="px-2 py-2 font-medium">Market</th>
            <th className="px-2 py-2 font-medium">Side</th>
            <th className="px-2 py-2 font-medium">Type</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="px-2 py-2 text-right font-medium">Quantity</th>
            <th className="px-2 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <HomeOrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HomeOrderRow({ order }: { order: Order }) {
  const isBuy = order.side === "BUY";
  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-2 py-3 font-medium text-[var(--text-primary)]">
        {baseAsset(order.symbol)}/USD
      </td>
      <td className={`px-2 py-3 font-medium ${isBuy ? "text-emerald-600" : "text-rose-500"}`}>
        {order.side}
      </td>
      <td className="px-2 py-3 text-[var(--text-muted)]">{order.order_type}</td>
      <td className="px-2 py-3 text-right tabular-nums text-[var(--text-primary)]">
        {order.price != null ? fmtUsd(Number(order.price)) : "Market"}
      </td>
      <td className="px-2 py-3 text-right tabular-nums">{order.quantity}</td>
      <td className="px-2 py-3 text-[var(--text-muted)]">{order.status}</td>
    </tr>
  );
}

function BalanceRow({
  symbol,
  balance,
  avgPrice,
  currentPrice,
}: BalanceRowModel) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = ASSET_NAMES[symbol] ?? symbol;
  const est =
    symbol === "USD"
      ? balance
      : currentPrice != null && Number.isFinite(currentPrice)
        ? balance * currentPrice
        : null;

  return (
    <tr className="border-t border-[var(--card-border)]">
      <td className="px-2 py-3">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
            {!imgFailed && symbol !== "USD" ? (
              <img
                src={assetIconUrl(symbol)}
                alt=""
                width={24}
                height={24}
                className="absolute inset-0 size-full rounded-full object-scale-down"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-[#268c45] text-[10px] font-semibold text-white">
                $
              </span>
            )}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
            <span className="text-xs text-[var(--text-muted)]">{symbol}</span>
          </div>
        </div>
      </td>
      <td className="px-2 py-3 text-sm font-medium text-[var(--text-primary)]">
        {balance.toLocaleString("en-US", { maximumFractionDigits: 8 })}
        <span className="ml-1 text-[var(--text-muted)]">{symbol}</span>
      </td>
      <td className="px-2 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
        {avgPrice == null ? (
          <span className="text-[var(--text-muted)]">—</span>
        ) : (
          <>
            {fmtUsd(avgPrice)}
            <span className="ml-1 font-normal text-[var(--text-muted)]">USD</span>
          </>
        )}
      </td>
      <td className="px-2 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
        {currentPrice == null ? (
          <span className="text-[var(--text-muted)]">—</span>
        ) : (
          <>
            {fmtUsd(currentPrice)}
            <span className="ml-1 font-normal text-[var(--text-muted)]">USD</span>
          </>
        )}
      </td>
      <td className="px-2 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
        {est == null ? (
          <span className="text-[var(--text-muted)]">—</span>
        ) : (
          <>
            {fmtUsd(est)}
            <span className="ml-1 font-normal text-[var(--text-muted)]">USD</span>
          </>
        )}
      </td>
    </tr>
  );
}

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function Empty({ copy }: { copy: string }) {
  return <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">{copy}</p>;
}
