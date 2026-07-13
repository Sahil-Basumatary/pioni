import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../../components/shell/shellIcons";

type PortfolioInsightsProps = {
  totalValue: number | null;
  cashBalance: number | null;
  unrealizedPnl: number | null;
};

export default function PortfolioInsights({
  totalValue,
  cashBalance,
  unrealizedPnl,
}: PortfolioInsightsProps) {
  const tv = fmt(totalValue);
  const cash = fmt(cashBalance);
  const upnl = fmt(unrealizedPnl);

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-black/[0.06] p-1">
      <InsightTile
        title="Main"
        to="/home"
        rows={[
          { label: "Total value", value: tv, suffix: "USD" },
          { label: "Available cash", value: cash, suffix: "USD" },
        ]}
      />
      <InsightTile
        title="Spot"
        to="/trading"
        rows={[
          { label: "Balance value", value: tv, suffix: "USD" },
          {
            label: "Balances UP&L",
            value: upnl,
            suffix: "USD",
            tone:
              unrealizedPnl == null
                ? "muted"
                : unrealizedPnl >= 0
                  ? "pos"
                  : "neg",
          },
        ]}
      />
      <InsightTile
        title="Margin"
        to="/trade/margin"
        rows={[
          { label: "Status", value: "Healthy", suffix: "" },
          { label: "Used margin", value: "0.00", suffix: "USD" },
        ]}
      />
      <Link
        to="/trading"
        aria-label="Open spot trading"
        className="rail-icon flex shrink-0 items-center justify-center rounded-xl px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowRightIcon className="h-5 w-5" />
      </Link>
    </div>
  );
}

function InsightTile({
  title,
  to,
  rows,
}: {
  title: string;
  to: string;
  rows: { label: string; value: string; suffix: string; tone?: "pos" | "neg" | "muted" }[];
}) {
  return (
    <Link
      to={to}
      className="min-w-[15rem] flex-1 rounded-xl px-3 py-3 hover:bg-[var(--card-bg)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
            <span
              className={`text-xs font-medium ${
                row.tone === "pos"
                  ? "text-emerald-600"
                  : row.tone === "neg"
                    ? "text-rose-500"
                    : "text-[var(--text-primary)]"
              }`}
            >
              {row.value}
              {row.suffix ? (
                <span className="ml-1 font-normal text-[var(--text-muted)]">{row.suffix}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function fmt(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
