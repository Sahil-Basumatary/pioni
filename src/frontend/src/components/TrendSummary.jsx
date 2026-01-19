import Metric from "./Metric";

export default function TrendSummary({ stats }) {
  if (!stats) return null;
  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "—");
  const deltaPrefix = stats.delta > 0 ? "+" : "";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-primary)]">Trend summary</p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {stats.bias} bias • {stats.direction} • Range {fmt(stats.range)}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Metric label="Last" value={fmt(stats.last)} />
        <Metric label="7D Δ" value={`${deltaPrefix}${fmt(stats.delta)}`} />
        <Metric label="7D Avg" value={fmt(stats.avg)} />
        <Metric label="Range" value={fmt(stats.range)} />
        <Metric label="Vol (σ)" value={fmt(stats.vol)} hint="Dispersion" />
      </div>
    </div>
  );
}

