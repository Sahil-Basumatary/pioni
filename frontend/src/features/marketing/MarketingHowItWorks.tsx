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
      className="mx-auto mt-20 w-full max-w-5xl px-4 sm:mt-24"
      aria-labelledby="mkt-how-title"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        How it works
      </p>
      <h2
        id="mkt-how-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl"
      >
        Practice the desk before anything is real
      </h2>
      <ol className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            data-mkt="how-step"
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]"
          >
            <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
              {step.n}
            </span>
            <h3 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
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
