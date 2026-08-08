const FAQS = [
  {
    q: "Does Pioni use real money?",
    a: "No. You cannot deposit or withdraw cash. Every balance, fill, and fee is simulated.",
  },
  {
    q: "Are prices live?",
    a: "Yes. Orders use live market data, so prices move with the market.",
  },
  {
    q: "What can I do on the desk?",
    a: "You can place spot orders, read charts and the order book, track positions, and review your trade history.",
  },
] as const;

export default function MarketingFaq() {
  return (
    <section
      id="faq"
      data-mkt="faq"
      className="mx-auto w-full max-w-3xl scroll-mt-32 px-4 pb-28 pt-20 sm:px-6 sm:pb-32 sm:pt-24"
      aria-labelledby="mkt-faq-title"
    >
      <h2
        id="mkt-faq-title"
        className="text-3xl type-display font-medium text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
      >
        FAQ
      </h2>
      <dl className="mt-9 space-y-3">
        {FAQS.map((item) => (
          <div
            key={item.q}
            data-mkt="faq-item"
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 pb-5 pt-4 shadow-[var(--shadow-card)] sm:px-6"
          >
            <dt className="text-sm font-semibold text-[var(--text-primary)]">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
