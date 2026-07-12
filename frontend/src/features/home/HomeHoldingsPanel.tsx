import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  useGetMySummaryQuery,
  type PortfolioPosition,
} from "../portfolio/portfolioApi";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";

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
        <Empty copy="No open orders — place a paper trade from Trade." />
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
  if (!signedIn) {
    return <Empty copy="Sign in to see your paper balances." />;
  }
  if (loading) return <Empty copy="Loading balances…" />;
  const rows: { symbol: string; balance: string; price: string | null }[] = [
    {
      symbol: "USD",
      balance: cash ?? "0",
      price: "1",
    },
    ...positions
      .filter((p) => Number(p.quantity) !== 0)
      .map((p) => ({
        symbol: baseAsset(p.symbol),
        balance: p.quantity,
        price: p.market_price,
      })),
  ];
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-xs text-[var(--text-muted)]">
          <th className="px-2 py-2 font-medium">Asset</th>
          <th className="px-2 py-2 font-medium">Balance</th>
          <th className="px-2 py-2 text-right font-medium">Current Price</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <BalanceRow key={row.symbol} {...row} />
        ))}
      </tbody>
    </table>
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
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-xs text-[var(--text-muted)]">
          <th className="px-2 py-2 font-medium">Asset</th>
          <th className="px-2 py-2 font-medium">Balance</th>
          <th className="px-2 py-2 text-right font-medium">Current Price</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <BalanceRow
            key={p.id}
            symbol={baseAsset(p.symbol)}
            balance={p.quantity}
            price={p.market_price}
          />
        ))}
      </tbody>
    </table>
  );
}

function BalanceRow({
  symbol,
  balance,
  price,
}: {
  symbol: string;
  balance: string;
  price: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = ASSET_NAMES[symbol] ?? symbol;
  const balNum = Number(balance);
  const pxNum = price != null ? Number(price) : null;
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
              <span className="flex size-full items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                {symbol.slice(0, 1)}
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
        {Number.isFinite(balNum)
          ? balNum.toLocaleString("en-US", { maximumFractionDigits: 8 })
          : balance}
        <span className="ml-1 text-[var(--text-muted)]">{symbol}</span>
      </td>
      <td className="px-2 py-3 text-right text-sm font-medium text-[var(--text-primary)]">
        {pxNum == null || !Number.isFinite(pxNum)
          ? "—"
          : pxNum.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        {pxNum != null && Number.isFinite(pxNum) ? (
          <span className="ml-1 text-[var(--text-muted)]">USD</span>
        ) : null}
      </td>
    </tr>
  );
}

function Empty({ copy }: { copy: string }) {
  return <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">{copy}</p>;
}
