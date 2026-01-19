export default function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
      {hint ? (
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

