import {
  MARKETING_CHIPS,
  type MarketingChipId,
} from "./marketingLiveRows";

type Props = {
  active: MarketingChipId;
  onChange: (id: MarketingChipId) => void;
};

export default function MarketingCategoryRail({ active, onChange }: Props) {
  return (
    <nav
      data-mkt="category-rail"
      className="marketing-category-rail border-b border-[var(--card-border)]"
      aria-label="Market categories"
    >
      <div className="mx-auto flex w-full max-w-[1320px] gap-5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {MARKETING_CHIPS.map((chip) => {
          const isActive = active === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(chip.id)}
              className={`shrink-0 border-b-2 pb-1 text-[15px] transition-colors ${
                isActive
                  ? "border-[var(--text-primary)] font-semibold text-[var(--text-primary)]"
                  : "border-transparent font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
