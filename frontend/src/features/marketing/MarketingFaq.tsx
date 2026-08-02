const FAQS = [
  {
    q: "Is this real money?",
    a: "No. Balances, fills, and fees are simulated. You cannot deposit or withdraw real cash.",
  },
  {
    q: "Are prices live?",
    a: "Yes. The desk uses live market data so you practice against real price movement.",
  },
  {
    q: "What can I practice?",
    a: "Spot order ticket, charts, order book, positions, history, and the overall desk workflow.",
  },
] as const;

export default function MarketingFaq() {
  return (
    <section
      id="faq"
      data-mkt="faq"
      className="mx-auto w-full max-w-3xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="mkt-faq-title"
    >
      <h2
        id="mkt-faq-title"
        className="text-center text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
      >
        FAQ
      </h2>
      <dl className="mt-10 space-y-4">
        {FAQS.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-4 shadow-[var(--shadow-card)]"
          >
            <dt className="text-sm font-semibold text-[var(--text-primary)]">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
