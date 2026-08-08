const STEPS = [
  {
    n: "01",
    title: "Create an account",
    body: "Start with 10,000 USD in simulated funds. There is nothing to deposit.",
  },
  {
    n: "02",
    title: "Place an order",
    body: "Use live prices to try market and limit orders from the full trading desk.",
  },
  {
    n: "03",
    title: "Review what happened",
    body: "Check your fills, positions, and order history before you make the next trade.",
  },
] as const;

export default function MarketingHowItWorks() {
  return (
    <section
      data-mkt="how"
      className="mx-auto w-full max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28"
      aria-labelledby="mkt-how-title"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          How it works
        </p>
        <h2
          id="mkt-how-title"
          className="mt-3 text-3xl type-display font-medium text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
        >
          Your first paper trade, step by step
        </h2>
      </div>
      <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((step) => (
          <li
            key={step.n}
            data-mkt="how-step"
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 pb-7 pt-5 shadow-[var(--shadow-card)]"
          >
            <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
              {step.n}
            </span>
            <h3 className="mt-6 text-base font-semibold text-[var(--text-primary)]">
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
