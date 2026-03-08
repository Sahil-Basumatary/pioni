interface EmptyStatePanelProps {
  variant: "search" | "history" | "warning";
  title: string;
  body?: string;
}

export default function EmptyStatePanel({ variant, title, body }: EmptyStatePanelProps) {
  const renderIcon = () => {
    if (variant === "search") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
      );
    }
    if (variant === "history") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="12" y2="17" />
        </svg>
      );
    }
    if (variant === "warning") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-600"
        >
          <path d="M10.29 3.86L1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
      );
    }
    return null;
  };
  return (
    <div className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{renderIcon()}</div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </p>
          {body && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
