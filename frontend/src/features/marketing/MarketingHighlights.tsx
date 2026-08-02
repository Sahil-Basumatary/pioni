const HIGHLIGHTS = [
  {
    title: "Simulated funds",
    body: "Practice balance you can reset. Nothing here is real money",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <path d="M16.5 14.5h1.5" />
      </>
    ),
  },
  {
    title: "Live markets",
    body: "Real prices, charts, and depth from live market data",
    icon: (
      <>
        <path d="M3 17.5l5-5 3.5 3L21 6.5" />
        <path d="M21 11V6.5h-4.5" />
      </>
    ),
  },
  {
    title: "A full desk",
    body: "Order ticket, book, positions, and history in one layout",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M9 4v16" />
        <path d="M9 12h12" />
      </>
    ),
  },
] as const;

export default function MarketingHighlights() {
  return (
    <section
      data-mkt="highlights"
      className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 sm:pt-20"
      aria-label="What Pioni gives you"
    >
      <dl className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05]">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--text-primary)]"
                aria-hidden
              >
                {item.icon}
              </svg>
            </span>
            <dt className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              {item.title}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
