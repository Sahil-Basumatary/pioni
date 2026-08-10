import { MARKET_CATALOG } from "../markets/catalog";
import MarketingDeskShot from "./MarketingDeskShot";

const CATEGORY_COUNT = new Set(MARKET_CATALOG.map((m) => m.category)).size;
const MAX_MARGIN = Math.max(...MARKET_CATALOG.map((m) => m.marginLeverage ?? 0));

/* Derived from the catalog so the numbers cannot drift from what the desk
   actually lists. */
const STATS = [
  { value: String(MARKET_CATALOG.length), label: "Markets" },
  { value: String(CATEGORY_COUNT), label: "Categories" },
  { value: `${MAX_MARGIN}x`, label: "Maximum margin" },
] as const;

export default function MarketingCoverage() {
  return (
    <section
      id="coverage"
      data-mkt="coverage"
      className="marketing-coverage scroll-mt-32 border-b border-[var(--card-border)] py-10"
      aria-labelledby="mkt-coverage-title"
    >
      <div className="mx-auto grid w-full max-w-[1320px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Coverage
          </p>
          <h2
            id="mkt-coverage-title"
            className="mt-2 text-2xl type-display font-medium text-[var(--text-primary)] sm:text-[28px] sm:leading-8"
          >
            What you can trade
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
            Trade major, Layer 1, Layer 2, payment, and infrastructure tokens.
            Every market is quoted in USD.
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} data-mkt="coverage-stat">
                <dt className="text-[26px] type-display font-medium leading-none text-[var(--text-primary)] tabular-nums">
                  {stat.value}
                </dt>
                <dd className="mt-1.5 text-[12px] leading-snug text-[var(--text-muted)]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <MarketingDeskShot />
      </div>
    </section>
  );
}
