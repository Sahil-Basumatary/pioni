import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ArrowTopRightIcon, ChevronDownSmallIcon } from "../components/shell/shellIcons";
import { baseAsset } from "../components/shell/activityFormat";
import {
  useGetMyLedgerQuery,
  useGetMyPositionsQuery,
  useGetMyTradesQuery,
  type PortfolioPosition,
  type PortfolioTrade,
} from "../features/portfolio/portfolioApi";
import { useListOrdersQuery, type Order } from "../features/orders/ordersApi";
import SignedOutUnlock from "../features/auth/SignedOutUnlock";
import TeachingEmpty from "../features/onboarding/TeachingEmpty";
import { useToast } from "../features/toasts/useToast";
import { formatUsd } from "../utils/formatters";
import {
  LEDGER_COLUMNS,
  ORDER_COLUMNS,
  TRADE_COLUMNS,
  filtersForSection,
  ledgerFromTrades,
  rowsFromLedgerEntries,
  sectionsForScope,
  type HistoryScope,
  type HistorySection,
  type LedgerRow,
} from "../features/history/historyContent";

const TRADE_FETCH_LIMIT = 100;

const SCOPES: { id: HistoryScope; label: string }[] = [
  { id: "main", label: "Main" },
  { id: "earn", label: "Earn" },
  { id: "otc", label: "OTC" },
];

const SECTION_LABEL: Record<HistorySection, string> = {
  ledger: "Ledger",
  orders: "Orders",
  trades: "Trades",
  positions: "Positions",
};

function matches(value: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || value.toLowerCase().includes(q);
}

export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const [scope, setScope] = useState<HistoryScope>("main");
  const [section, setSection] = useState<HistorySection>("ledger");
  const [filterState, setFilterState] = useState<Record<string, string>>({});

  const sections = sectionsForScope(scope);
  const activeSection = sections.includes(section) ? section : sections[0];
  const filters = filtersForSection(activeSection);
  const mainScope = scope === "main";

  const trades = useGetMyTradesQuery(
    { limit: TRADE_FETCH_LIMIT },
    {
      skip:
        !isSignedIn ||
        !mainScope ||
        (activeSection !== "ledger" && activeSection !== "trades"),
    },
  );
  const ledger = useGetMyLedgerQuery(
    { limit: TRADE_FETCH_LIMIT },
    { skip: !isSignedIn || !mainScope || activeSection !== "ledger" },
  );
  const orders = useListOrdersQuery(
    { limit: TRADE_FETCH_LIMIT },
    { skip: !isSignedIn || !mainScope || activeSection !== "orders" },
  );
  const positions = useGetMyPositionsQuery(
    { openOnly: false },
    { skip: !isSignedIn || !mainScope || activeSection !== "positions" },
  );

  const ledgerFallback = useMemo(() => {
    if (ledger.data && ledger.data.length > 0) return null;
    if (!trades.data?.length) return null;
    return ledgerFromTrades(trades.data);
  }, [ledger.data, trades.data]);

  const ledgerQuery = useMemo(() => {
    if (ledger.data && ledger.data.length > 0) {
      return {
        data: rowsFromLedgerEntries(ledger.data),
        isLoading: ledger.isLoading,
        isError: ledger.isError,
        refetch: ledger.refetch,
      };
    }
    if (ledgerFallback) {
      return {
        data: ledgerFallback,
        isLoading: ledger.isLoading || trades.isLoading,
        isError: ledger.isError && trades.isError,
        refetch: () => {
          void ledger.refetch();
          void trades.refetch();
        },
      };
    }
    return {
      data: ledger.data ? rowsFromLedgerEntries(ledger.data) : undefined,
      isLoading: ledger.isLoading || trades.isLoading,
      isError: ledger.isError,
      refetch: ledger.refetch,
    };
  }, [ledger, ledgerFallback, trades]);

  const filterValues = useMemo(
    () => Object.fromEntries(filters.map((f) => [f, ""])),
    [filters],
  );
  const mergedFilters = { ...filterValues, ...filterState };

  if (!isSignedIn) {
    return <SignedOutUnlock size="page" showLogo />;
  }

  const onScope = (next: HistoryScope) => {
    setScope(next);
    setFilterState({});
    const nextSections = sectionsForScope(next);
    if (!nextSections.includes(section)) setSection(nextSections[0]);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1750px] flex-col items-center gap-2 px-2 py-2">
      <div className="flex w-full items-start gap-x-2">
        <div
          role="tablist"
          aria-label="History scope"
          className="relative z-0 flex flex-1 gap-0.5 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
        >
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={scope === s.id}
              onClick={() => onScope(s.id)}
              className={`z-[1] box-border flex w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-[10px] border-0 px-2 py-1.5 text-xs font-medium transition-colors ${
                scope === s.id
                  ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 mb-1 flex w-full items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="History section"
          className="relative grid grid-flow-col gap-x-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
        >
          {sections.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSection === id}
              onClick={() => {
                setSection(id);
                setFilterState({});
              }}
              className={`rail-icon rounded-[10px] px-3 py-1.5 text-xs font-medium ${
                activeSection === id
                  ? "!bg-white text-[var(--text-primary)]"
                  : "!bg-transparent text-[var(--text-muted)]"
              }`}
            >
              {SECTION_LABEL[id]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => toast("Paper statements — coming soon")}
          className="rail-icon inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--accent)] hover:opacity-80"
        >
          View statements
          <ArrowTopRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <section className="flex w-full grow flex-col overflow-hidden rounded-2xl bg-[var(--card-bg)] shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        {isSignedIn && mainScope && (
          <div className="px-3 pt-3">
            <div className="mb-3 flex w-full flex-wrap gap-2">
              {filters.map((label) => (
                <label
                  key={label}
                  className="flex min-w-[140px] flex-1 items-center gap-2 rounded-lg bg-[rgba(104,107,130,0.08)] px-3 py-1.5 text-xs text-[var(--text-muted)] xl:flex-none xl:min-w-[250px]"
                >
                  <span className="shrink-0">{label}</span>
                  <input
                    value={mergedFilters[label] ?? ""}
                    onChange={(e) =>
                      setFilterState((prev) => ({ ...prev, [label]: e.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none"
                    aria-label={label}
                  />
                  <ChevronDownSmallIcon className="h-3.5 w-3.5 shrink-0" />
                </label>
              ))}
              <button
                type="button"
                onClick={() => setFilterState({})}
                className="inline-flex h-8 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-3 text-xs font-medium text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.14)]"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {!mainScope ? (
          <EmptyPanel
            title={`No ${scope === "earn" ? "Earn" : "OTC"} activity`}
            body={`${scope === "earn" ? "Earn" : "OTC"} runs on simulated desks that do not post to your ledger yet.`}
          />
        ) : activeSection === "ledger" ? (
          <SectionPanel query={ledgerQuery} empty={<TeachingEmpty id="history_ledger" size="panel" />}>
            {(rows: LedgerRow[]) => (
              <LedgerTable
                rows={rows}
                assetQuery={mergedFilters.Assets ?? ""}
                typeQuery={mergedFilters.Types ?? ""}
              />
            )}
          </SectionPanel>
        ) : activeSection === "orders" ? (
          <SectionPanel query={orders} empty={<TeachingEmpty id="history_orders" size="panel" />}>
            {(rows: Order[]) => (
              <OrdersTable
                orders={rows}
                marketQuery={mergedFilters.Market ?? ""}
                typeQuery={mergedFilters.Types ?? ""}
              />
            )}
          </SectionPanel>
        ) : activeSection === "trades" ? (
          <SectionPanel query={trades} empty={<TeachingEmpty id="history_trades" size="panel" />}>
            {(rows: PortfolioTrade[]) => (
              <TradesTable trades={rows} marketQuery={mergedFilters.Market ?? ""} />
            )}
          </SectionPanel>
        ) : (
          <SectionPanel query={positions} empty={<TeachingEmpty id="home_positions" size="panel" />}>
            {(rows: PortfolioPosition[]) => (
              <PositionsTable
                positions={rows}
                marketQuery={mergedFilters.Market ?? ""}
              />
            )}
          </SectionPanel>
        )}
      </section>
    </div>
  );
}

type SectionQuery<T> = {
  data?: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};

function SectionPanel<T>({
  query,
  empty,
  children,
}: {
  query: SectionQuery<T>;
  empty: React.ReactNode;
  children: (rows: T[]) => React.ReactNode;
}) {
  if (query.isLoading) {
    return (
      <p className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Loading…</p>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12">
        <p className="text-sm text-[var(--text-muted)]">Couldn’t load history.</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }
  const rows = query.data ?? [];
  if (!rows.length) return <>{empty}</>;
  return <>{children(rows)}</>;
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

function TableShell({
  columns,
  minWidth,
  children,
}: {
  columns: readonly string[];
  minWidth: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} border-collapse text-sm`}>
        <thead>
          <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function NoMatch({ span }: { span: number }) {
  return (
    <tr>
      <td
        colSpan={span}
        className="px-4 py-10 text-center text-sm text-[var(--text-muted)]"
      >
        No rows match these filters.
      </td>
    </tr>
  );
}

function LedgerTable({
  rows,
  assetQuery,
  typeQuery,
}: {
  rows: LedgerRow[];
  assetQuery: string;
  typeQuery: string;
}) {
  const filtered = rows.filter(
    (r) => matches(r.asset, assetQuery) && matches(r.type, typeQuery),
  );
  return (
    <TableShell columns={LEDGER_COLUMNS} minWidth="min-w-[840px]">
      {!filtered.length ? (
        <NoMatch span={LEDGER_COLUMNS.length} />
      ) : (
        filtered.map((row) => (
          <tr key={row.id} className="border-b border-[var(--card-border)] last:border-b-0">
            <td className="px-4 py-3 font-medium">{row.type}</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">{row.wallet}</td>
            <td className="px-4 py-3">{row.asset}</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">{row.ticker}</td>
            <td className="px-4 py-3 tabular-nums">{row.amount}</td>
            <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">{row.fee}</td>
            <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">{row.balance}</td>
            <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{row.id}</td>
          </tr>
        ))
      )}
    </TableShell>
  );
}

function OrdersTable({
  orders,
  marketQuery,
  typeQuery,
}: {
  orders: Order[];
  marketQuery: string;
  typeQuery: string;
}) {
  const rows = orders.filter(
    (o) => matches(baseAsset(o.symbol), marketQuery) && matches(o.order_type, typeQuery),
  );
  return (
    <TableShell columns={ORDER_COLUMNS} minWidth="min-w-[820px]">
      {!rows.length ? (
        <NoMatch span={ORDER_COLUMNS.length} />
      ) : (
        rows.map((row) => {
          const filled = Number(row.filled_quantity);
          const avg = row.average_fill_price != null ? Number(row.average_fill_price) : null;
          const cost =
            avg != null && Number.isFinite(filled) ? formatUsd(avg * filled) : "—";
          return (
            <tr key={row.id} className="border-b border-[var(--card-border)] last:border-b-0">
              <td className="px-4 py-3 font-medium">{baseAsset(row.symbol)}/USD</td>
              <td
                className={`px-4 py-3 font-medium ${
                  row.side === "BUY" ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {row.side === "BUY" ? "Buy" : "Sell"}
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.order_type}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.status}</td>
              <td className="px-4 py-3 tabular-nums">{row.filled_quantity}</td>
              <td className="px-4 py-3 tabular-nums">{cost}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{row.id}</td>
            </tr>
          );
        })
      )}
    </TableShell>
  );
}

function TradesTable({
  trades,
  marketQuery,
}: {
  trades: PortfolioTrade[];
  marketQuery: string;
}) {
  const rows = trades.filter((t) => matches(baseAsset(t.symbol), marketQuery));
  return (
    <TableShell columns={TRADE_COLUMNS} minWidth="min-w-[820px]">
      {!rows.length ? (
        <NoMatch span={TRADE_COLUMNS.length} />
      ) : (
        rows.map((row) => {
          const asset = baseAsset(row.symbol);
          const qty = Number(row.quantity);
          const price = Number(row.price);
          const cost =
            Number.isFinite(qty) && Number.isFinite(price)
              ? formatUsd(qty * price)
              : "—";
          return (
            <tr key={row.id} className="border-b border-[var(--card-border)] last:border-b-0">
              <td
                className={`px-4 py-3 font-medium ${
                  row.side === "BUY" ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {row.side === "BUY" ? "Buy" : "Sell"}
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">Fill</td>
              <td className="px-4 py-3 font-medium">{asset}/USD</td>
              <td className="px-4 py-3 tabular-nums">
                {row.quantity} {asset}
              </td>
              <td className="px-4 py-3 tabular-nums">{cost}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{row.id}</td>
            </tr>
          );
        })
      )}
    </TableShell>
  );
}

const POSITION_COLUMNS = [
  "Market",
  "Size",
  "Avg. entry",
  "Mark",
  "Unrealized P&L",
  "Realized P&L",
] as const;

function PositionsTable({
  positions,
  marketQuery,
}: {
  positions: PortfolioPosition[];
  marketQuery: string;
}) {
  const rows = positions.filter((p) => matches(baseAsset(p.symbol), marketQuery));
  return (
    <TableShell columns={POSITION_COLUMNS} minWidth="min-w-[760px]">
      {!rows.length ? (
        <NoMatch span={POSITION_COLUMNS.length} />
      ) : (
        rows.map((row) => {
          const upnl = row.unrealized_pnl != null ? Number(row.unrealized_pnl) : null;
          return (
            <tr key={row.id} className="border-b border-[var(--card-border)] last:border-b-0">
              <td className="px-4 py-3 font-medium">{baseAsset(row.symbol)}/USD</td>
              <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
              <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                {formatUsd(row.avg_entry_price)}
              </td>
              <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                {row.market_price != null ? formatUsd(row.market_price) : "—"}
              </td>
              <td
                className={`px-4 py-3 font-medium tabular-nums ${
                  upnl == null
                    ? "text-[var(--text-muted)]"
                    : upnl >= 0
                      ? "text-emerald-600"
                      : "text-rose-500"
                }`}
              >
                {upnl == null ? "—" : formatUsd(upnl)}
              </td>
              <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                {formatUsd(row.realized_pnl)}
              </td>
            </tr>
          );
        })
      )}
    </TableShell>
  );
}
