import { useMemo } from "react";
import MarketingMarketCard from "./MarketingMarketCard";
import type { LiveMarketRow, MarketingChipId } from "./marketingLiveRows";

type Props = {
  rows: LiveMarketRow[];
  /* Symbols already on screen in the flat grid above. */
  exclude: Set<string>;
  onSelectCategory: (id: MarketingChipId) => void;
};

/* Two per row on desktop, so anything that cannot fill whole rows would leave a
   gap in the grid. */
const CARDS_PER_SECTION = 4;

type Section = {
  category: string;
  total: number;
  cards: LiveMarketRow[];
};

function buildSections(rows: LiveMarketRow[], exclude: Set<string>): Section[] {
  const byCategory = new Map<string, LiveMarketRow[]>();
  for (const row of rows) {
    const bucket = byCategory.get(row.category);
    if (bucket) bucket.push(row);
    else byCategory.set(row.category, [row]);
  }
  return [...byCategory.entries()]
    .map(([category, list]) => {
      const fresh = list
        .filter((row) => !exclude.has(row.symbol))
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
      // Round down to whole rows so a section never ends on a half-empty one.
      const take =
        fresh.length >= CARDS_PER_SECTION
          ? CARDS_PER_SECTION
          : fresh.length - (fresh.length % 2);
      return { category, total: list.length, cards: fresh.slice(0, take) };
    })
    .filter((section) => section.cards.length >= 2)
    .sort((a, b) => b.total - a.total);
}

export default function MarketingCategorySections({
  rows,
  exclude,
  onSelectCategory,
}: Props) {
  const sections = useMemo(() => buildSections(rows, exclude), [rows, exclude]);

  if (!sections.length) return null;

  return (
    <div data-mkt="category-sections">
      {sections.map((section) => (
        <section
          key={section.category}
          data-mkt="category-section"
          className="pt-8"
          aria-labelledby={`mkt-cat-${section.category.replace(/\s+/g, "-")}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id={`mkt-cat-${section.category.replace(/\s+/g, "-")}`}
              className="text-xl type-display font-medium text-[var(--text-primary)] sm:text-2xl"
            >
              {section.category}
            </h2>
            <button
              type="button"
              onClick={() => onSelectCategory(section.category as MarketingChipId)}
              className="text-[13px] font-medium text-[var(--text-primary)] underline-offset-4 hover:underline"
            >
              See all {section.total}
            </button>
          </div>
          <div className="marketing-market-grid mt-3">
            {section.cards.map((row) => (
              <MarketingMarketCard key={row.symbol} row={row} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
