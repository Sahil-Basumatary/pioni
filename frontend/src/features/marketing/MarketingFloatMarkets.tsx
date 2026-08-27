import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MarketingMarketCard from "./MarketingMarketCard";
import {
  chipLabel,
  type LiveMarketRow,
  type MarketingChipId,
} from "./marketingLiveRows";

type Props = {
  rows: LiveMarketRow[];
  allRows: LiveMarketRow[];
  chip: MarketingChipId;
};

const MIN_ROWS_BEFORE_SPILLOVER = 9;
export const COLLAPSED_ROWS = 12;

export default function MarketingFloatMarkets({ rows, allRows, chip }: Props) {
  const [expanded, setExpanded] = useState(false);

  const rest = useMemo(() => {
    if (rows.length >= MIN_ROWS_BEFORE_SPILLOVER) return [];
    const shown = new Set(rows.map((row) => row.symbol));
    return allRows.filter((row) => !shown.has(row.symbol));
  }, [rows, allRows]);

  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  const restBudget = Math.max(0, COLLAPSED_ROWS - visibleRows.length);
  const visibleRest = expanded ? rest : rest.slice(0, restBudget);
  const hidden =
    rows.length + rest.length - visibleRows.length - visibleRest.length;

  return (
    <section
      id="markets"
      data-mkt="float-markets"
      className="scroll-mt-32 pt-6"
      aria-labelledby="mkt-float-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="mkt-float-title"
          className="text-xl type-display font-medium text-[var(--text-primary)] sm:text-2xl"
        >
          {chipLabel(chip)}
        </h2>
        <div className="flex items-baseline gap-3 text-[13px]">
          <span className="text-[var(--text-muted)]">
            {rows.length} live {rows.length === 1 ? "pair" : "pairs"}
          </span>
          <Link
            to="/markets"
            className="font-medium text-[var(--text-primary)] underline-offset-4 hover:underline"
          >
            Browse all
          </Link>
        </div>
      </div>

      {visibleRows.length ? (
        <div className="marketing-market-grid mt-3">
          {visibleRows.map((row) => (
            <MarketingMarketCard key={row.symbol} row={row} />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
          No pairs in this category yet.
        </p>
      )}

      {visibleRest.length ? (
        <div className="mt-5">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
            More markets
          </h3>
          <div className="marketing-market-grid mt-3">
            {visibleRest.map((row) => (
              <MarketingMarketCard key={row.symbol} row={row} />
            ))}
          </div>
        </div>
      ) : null}

      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[13px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--mkt-hover)]"
        >
          {expanded ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </section>
  );
}
