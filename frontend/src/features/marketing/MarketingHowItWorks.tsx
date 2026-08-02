const STEPS = [
  {
    n: "01",
    title: "Start with practice funds",
    body: "Open an account and get simulated balance. Nothing here is real money.",
  },
  {
    n: "02",
    title: "Trade on a full desk",
    body: "Place market and limit orders with live prices, charts, and an order book.",
  },
  {
    n: "03",
    title: "Learn the workflow",
    body: "Follow positions, fills, and history until the desk feels second nature.",
  },
] as const;

export default function MarketingHowItWorks() {
  return (
    <section
      data-mkt="how"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="mkt-how-title"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          How it works
        </p>
        <h2
          id="mkt-how-title"
          className="mt-3 text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
        >
          Practice the desk before anything is real
        </h2>
      </div>
      <ol className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            data-mkt="how-step"
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]"
          >
            <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
              {step.n}
            </span>
            <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
