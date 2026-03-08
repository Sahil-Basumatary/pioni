interface ChipProps {
  label: string;
  value: string;
  hint?: string;
}

export default function Chip({ label, value, hint }: ChipProps) {
  return (
    <div className="rounded-full border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
        {value}
        {hint ? (
          <span className="ml-2 text-[10px] font-medium text-[var(--text-muted)]">{hint}</span>
        ) : null}
      </p>
    </div>
  );
}
