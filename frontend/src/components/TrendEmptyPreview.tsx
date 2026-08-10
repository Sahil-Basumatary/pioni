import Metric from "./Metric";

export default function TrendEmptyPreview() {
  return (
    <div className="space-y-4">
      <div className="w-full h-56 relative overflow-hidden rounded-xl bg-[var(--card-bg)]">
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.12]">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border border-black/5"></div>
          ))}
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,26 18,18 36,24 54,12 72,16 90,10 100,14"
          />
        </svg>
      </div>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Enter a ticker</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          View bias, 7-day change, range, and top drivers.
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Metric label="Bias" value="—" />
          <Metric label="7D Δ" value="—" />
          <Metric label="Range" value="—" />
          <Metric label="Drivers" value="—" />
        </div>
      </div>
    </div>
  );
}
