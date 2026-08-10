const FAQS = [
  {
    q: "Does Pioni use real money?",
    a: "No. You cannot deposit or withdraw cash, and every balance, fill, and fee is simulated.",
  },
  {
    q: "Where do the prices come from?",
    a: "Public exchange data. Prices refresh while the page is open.",
  },
  {
    q: "Are there fees?",
    a: "Nothing is charged. Spot and margin are 0%. Futures shows simulated maker and taker rates.",
  },
] as const;

export default function MarketingFaq() {
  return (
    <section
      id="faq"
      data-mkt="faq"
      className="mx-auto w-full max-w-[1320px] scroll-mt-32 px-4 py-10 sm:px-6"
      aria-labelledby="mkt-faq-title"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)] lg:gap-12">
        <h2
          id="mkt-faq-title"
          className="text-2xl type-display font-medium text-[var(--text-primary)] sm:text-[28px] sm:leading-8"
        >
          FAQ
        </h2>
        <dl className="space-y-2.5">
          {FAQS.map((item) => (
            <div
              key={item.q}
              data-mkt="faq-item"
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <dt className="text-[14px] font-semibold text-[var(--text-primary)]">{item.q}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
