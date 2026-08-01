const PROOFS = [
  {
    title: "Trade workspace",
    body: "Charts, order book, and ticket in one layout so you practice the real flow.",
    mock: "chart",
  },
  {
    title: "Guided onboarding",
    body: "A short checklist walks you from first deposit of paper funds to first fill.",
    mock: "checklist",
  },
  {
    title: "Portfolio and history",
    body: "See balances, positions, and fills update as you trade with simulated funds.",
    mock: "portfolio",
  },
] as const;

function ProofMock({ kind }: { kind: (typeof PROOFS)[number]["mock"] }) {
  if (kind === "chart") {
    return (
      <div className="marketing-proof-mock" aria-hidden>
        <div className="marketing-proof-mock__bar" />
        <svg viewBox="0 0 280 120" className="mt-4 h-28 w-full">
          <path
            d="M8 90 C40 84 52 70 80 66 C108 62 120 78 148 58 C176 38 196 44 220 32 C240 24 255 28 272 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--text-primary)]"
          />
          <path
            d="M8 100 C40 96 60 88 90 84 C120 80 140 90 170 74 C200 58 230 62 272 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="text-[var(--text-muted)] opacity-50"
          />
        </svg>
      </div>
    );
  }
  if (kind === "checklist") {
    return (
      <div className="marketing-proof-mock space-y-2.5" aria-hidden>
        {["Open the desk", "Place a paper order", "Review the fill"].map((label, i) => (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                i < 2
                  ? "bg-[var(--text-primary)] text-white"
                  : "border border-[var(--card-border)]"
              }`}
            >
              {i < 2 ? (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path
                    d="M2 5.2 L4.1 7.2 L8 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span className="text-sm text-[var(--text-primary)]">{label}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="marketing-proof-mock space-y-3" aria-hidden>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--text-muted)]">Available</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            10,000 USD
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--text-muted)]">Positions</div>
          <div className="mt-1 text-sm font-medium tabular-nums text-[var(--text-primary)]">
            2 open
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full w-2/3 rounded-full bg-[var(--text-primary)]" />
      </div>
    </div>
  );
}

export default function MarketingProof() {
  return (
    <section
      data-mkt="proof"
      className="mx-auto mt-20 w-full max-w-5xl px-4 sm:mt-24"
      aria-labelledby="mkt-proof-title"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Product
      </p>
      <h2
        id="mkt-proof-title"
        className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl"
      >
        Built like a trading desk. Softened for practice.
      </h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PROOFS.map((item) => (
          <article
            key={item.title}
            data-mkt="proof-card"
            className="flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]"
          >
            <ProofMock kind={item.mock} />
            <h3 className="mt-5 text-base font-semibold text-[var(--text-primary)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
