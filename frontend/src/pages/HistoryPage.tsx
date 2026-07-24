import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ArrowTopRightIcon, ChevronDownSmallIcon } from "../components/shell/shellIcons";
import { useGetMyTradesQuery, type PortfolioTrade } from "../features/portfolio/portfolioApi";
import { ActivityFillRow } from "../features/home/ActivityFillRow";
import TeachingEmpty from "../features/onboarding/TeachingEmpty";
import { useToast } from "../features/toasts/useToast";
import {
  LEDGER_COLUMNS,
  ORDER_COLUMNS,
  PAPER_LEDGER,
  PAPER_ORDERS,
  PAPER_TRADES,
  TRADE_COLUMNS,
  filtersForSection,
  sectionsForScope,
  type HistoryScope,
  type HistorySection,
} from "../features/history/historyContent";

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

export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const [scope, setScope] = useState<HistoryScope>("main");
  const [section, setSection] = useState<HistorySection>("ledger");
  const sections = sectionsForScope(scope);
  const filters = filtersForSection(section);

  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: 100 },
    { skip: !isSignedIn || section !== "trades" || scope !== "main" },
  );

  const activeSection = sections.includes(section) ? section : sections[0];

  const onScope = (next: HistoryScope) => {
    setScope(next);
    const nextSections = sectionsForScope(next);
    if (!nextSections.includes(section)) setSection(nextSections[0]);
  };

  const filterValues = useMemo(
    () => Object.fromEntries(filters.map((f) => [f, ""])),
    [filters],
  );
  const [filterState, setFilterState] = useState<Record<string, string>>({});
  const mergedFilters = { ...filterValues, ...filterState };

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
              onClick={() => setSection(id)}
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
        <div className="px-3 pt-3">
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex w-full flex-wrap gap-2">
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
        </div>

        {activeSection === "ledger" ? (
          <LedgerTable
            query={mergedFilters.Assets ?? ""}
            typeQuery={mergedFilters.Types ?? ""}
          />
        ) : activeSection === "orders" ? (
          <OrdersTable />
        ) : activeSection === "trades" ? (
          <TradesPanel
            isSignedIn={!!isSignedIn}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            live={data}
          />
        ) : (
          <TeachingEmpty id="history_activity" size="panel" />
        )}
      </section>
    </div>
  );
}

function LedgerTable({
  query,
  typeQuery,
}: {
  query: string;
  typeQuery: string;
}) {
  const rows = PAPER_LEDGER.filter((r) => {
    const q = query.trim().toLowerCase();
    const t = typeQuery.trim().toLowerCase();
    if (q && !`${r.asset} ${r.ticker}`.toLowerCase().includes(q)) return false;
    if (t && !r.type.toLowerCase().includes(t)) return false;
    return true;
  });
  if (!rows.length) {
    return <TeachingEmpty id="history_ledger" size="panel" />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
            {LEDGER_COLUMNS.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--card-border)] last:border-b-0"
            >
              <td className="px-4 py-3 font-medium">{row.type}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.wallet}</td>
              <td className="px-4 py-3">{row.asset}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.ticker}</td>
              <td className="px-4 py-3 tabular-nums">{row.amount}</td>
              <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                {row.fee}
              </td>
              <td className="px-4 py-3 tabular-nums">{row.balance}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                {row.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable() {
  if (!PAPER_ORDERS.length) {
    return <TeachingEmpty id="history_orders" size="panel" />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
            {ORDER_COLUMNS.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PAPER_ORDERS.map((row) => (
            <tr key={row.id} className="border-b border-[var(--card-border)]">
              <td className="px-4 py-3">{row.side}</td>
              <td className="px-4 py-3">{row.type}</td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
              <td className="px-4 py-3 tabular-nums">{row.cost}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                {row.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradesPanel({
  isSignedIn,
  isLoading,
  isError,
  onRetry,
  live,
}: {
  isSignedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  live?: PortfolioTrade[] | null;
}) {
  if (isSignedIn) {
    if (isLoading) {
      return (
        <p className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
          Loading…
        </p>
      );
    }
    if (isError) {
      return (
        <div className="flex flex-col items-center gap-2 px-4 py-12">
          <p className="text-sm text-[var(--text-muted)]">Couldn’t load trades.</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
          >
            Retry
          </button>
        </div>
      );
    }
    if (live?.length) {
      return (
        <ul className="mx-auto flex max-w-xl list-none flex-col px-2 pb-4">
          {live.map((trade) => (
            <ActivityFillRow key={trade.id} trade={trade} />
          ))}
        </ul>
      );
    }
    return <TeachingEmpty id="history_trades" size="panel" />;
  }

  if (!PAPER_TRADES.length) {
    return <TeachingEmpty id="history_trades" size="panel" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
            {TRADE_COLUMNS.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PAPER_TRADES.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--card-border)] last:border-b-0"
            >
              <td className="px-4 py-3 font-medium">{row.side}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.type}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{row.market}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {row.marketName}
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums">{row.volume}</td>
              <td className="px-4 py-3 tabular-nums">{row.cost}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                {row.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

