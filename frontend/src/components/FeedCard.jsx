export default function FeedCard({ item }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg)] p-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
          {item.type === "news" ? "News" : "Reddit"}
        </span>
        {typeof item.score === "number" && (
          <span
            className={
              item.score > 0.1
                ? "text-emerald-600 text-xs font-medium"
                : item.score < -0.1
                ? "text-red-500 text-xs font-medium"
                : "text-[var(--text-muted)] text-xs font-medium"
            }
          >
            {item.score.toFixed(2)}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-[var(--text-primary)] leading-snug line-clamp-3">
        {item.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
        {item.source && <span>{item.source}</span>}
        {item.ago && (
          <>
            <span>•</span>
            <span>{item.ago}</span>
          </>
        )}
      </div>
    </div>
  );
}

