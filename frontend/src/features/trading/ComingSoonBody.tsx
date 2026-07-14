export default function ComingSoonBody({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Coming soon
      </p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  );
}
