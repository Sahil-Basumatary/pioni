import { formatSigned } from "../utils/formatters";

export default function TrendDrivers({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-primary)]">Key drivers</p>
        <p className="text-[11px] text-[var(--text-muted)]">Largest-magnitude items</p>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
                    {item.type === "news" ? "News" : "Reddit"}
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {item.source || ""}{item.ago ? ` • ${item.ago}` : ""}
                  </p>
                </div>
                <p className="mt-1 text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
                  {item.title}
                </p>
              </div>
              {typeof item.score === "number" && (
                <span
                  className={
                    item.score > 0.1
                      ? "text-emerald-600 text-xs font-semibold tabular-nums"
                      : item.score < -0.1
                      ? "text-red-500 text-xs font-semibold tabular-nums"
                      : "text-[var(--text-muted)] text-xs font-semibold tabular-nums"
                  }
                >
                  {formatSigned(item.score, 2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

