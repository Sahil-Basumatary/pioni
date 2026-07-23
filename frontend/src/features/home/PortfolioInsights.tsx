import { Link } from "react-router-dom";

type PortfolioInsightsProps = {
  totalValue: number | null;
  availableMargin: number | null;
  unrealizedPnl: number | null;
};

export default function PortfolioInsights({
  totalValue,
  availableMargin,
  unrealizedPnl,
}: PortfolioInsightsProps) {
  const tv = fmt(totalValue);
  const margin = fmt(availableMargin);
  const upnl = fmt(unrealizedPnl);

  return (
    <div className="flex flex-col gap-1 sm:flex-row">
      <div className="flex flex-col gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1 sm:flex-[3] sm:flex-row">
        <InsightTile
          title="Main"
          to="/home"
          rows={[
            { label: "Total value", value: tv, suffix: "USD" },
            { label: "Available margin", value: margin, suffix: "USD" },
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
          badge="Healthy"
          to="/trade/margin"
          rows={[
            { label: "Positions UP&L", value: "—", suffix: "USD" },
            { label: "Used margin", value: "0.00", suffix: "USD" },
          ]}
        />
      </div>
      <div className="rounded-xl bg-[rgba(104,107,130,0.08)] p-1 sm:flex-1">
        <InsightTile
          title="Inverse Futures"
          to="/trade/futures"
          rows={[
            { label: "Balance value", value: "—", suffix: "USD" },
            { label: "Positions UP&L", value: "—", suffix: "USD" },
          ]}
        />
      </div>
    </div>
  );
}

function InsightTile({
  title,
  badge,
  to,
  rows,
}: {
  title: string;
  badge?: string;
  to: string;
  rows: { label: string; value: string; suffix: string; tone?: "pos" | "neg" | "muted" }[];
}) {
  return (
    <Link
      to={to}
      className="w-full rounded-xl px-3 py-3 hover:bg-[var(--card-bg)] sm:min-w-0 sm:flex-1"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        {badge ? (
          <span className="rounded bg-[rgba(20,158,97,0.16)] px-1.5 py-0.5 text-[10px] font-medium text-[rgb(2,107,63)]">
            {badge}
          </span>
        ) : null}
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
