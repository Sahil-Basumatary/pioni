import { useState } from "react";
import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import {
  formatChangePct,
  formatMarketPrice,
  formatVolume,
  sparklinePath,
  sparklinePoints,
} from "../markets/format";
import { deskPath } from "../markets/marketLinks";
import { changeTone, type LiveMarketRow } from "./marketingLiveRows";

type Props = {
  rows: LiveMarketRow[];
};

function PeekCard({ row }: { row: LiveMarketRow }) {
  return (
    <Link
      to={deskPath(row.symbol)}
      data-mkt="featured-card"
      className="hidden min-w-0 flex-1 flex-col justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--mkt-ink-500)] hover:bg-[var(--mkt-hover)] lg:flex"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {row.category}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <img
            src={assetIconUrl(row.symbol)}
            alt=""
            className="h-8 w-8 rounded-full bg-white object-scale-down"
          />
          <span className="truncate text-lg type-display font-medium text-[var(--text-primary)]">
            {row.name}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xl font-medium tabular-nums text-[var(--text-primary)]">
          {formatMarketPrice(row.price)}
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2 text-[12px] tabular-nums">
          <span className={`font-medium ${changeTone(row.changePct)}`}>
            {formatChangePct(row.changePct)}
          </span>
          <span className="text-[var(--text-muted)]">{formatVolume(row.volume)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketingFeaturedMarket({ rows }: Props) {
  const [index, setIndex] = useState(0);
  if (!rows.length) return null;

  const safeIndex = index % rows.length;
  const row = rows[safeIndex]!;
  const peek = rows.length > 1 ? rows[(safeIndex + 1) % rows.length]! : null;
  const path = sparklinePath(sparklinePoints(row.changePct, row.symbol, 28), 280, 64);
  const up = row.changePct != null && row.changePct >= 0;

  return (
    <section
      id="featured"
      data-mkt="featured"
      className="scroll-mt-32"
      aria-labelledby="mkt-featured-title"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Featured on the desk
        </p>
        {rows.length > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous featured market"
              onClick={() => setIndex((i) => (i - 1 + rows.length) % rows.length)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--text-muted)] transition hover:bg-[var(--mkt-hover)] hover:text-[var(--text-primary)]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <path
                  d="M10 3 5 8l5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next featured market"
              onClick={() => setIndex((i) => (i + 1) % rows.length)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--text-muted)] transition hover:bg-[var(--mkt-hover)] hover:text-[var(--text-primary)]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <path
                  d="m6 3 5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex gap-3">
        <Link
          to={deskPath(row.symbol)}
          data-mkt="featured-card"
          className="group flex min-w-0 flex-[1.6] flex-col justify-between gap-5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--mkt-elevation-mid)] transition hover:border-[var(--mkt-ink-500)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {row.category}
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <img
                  src={assetIconUrl(row.symbol)}
                  alt=""
                  className="h-10 w-10 rounded-full bg-white object-scale-down"
                />
                <div className="min-w-0">
                  <h2
                    id="mkt-featured-title"
                    className="truncate text-xl type-display font-medium text-[var(--text-primary)] sm:text-2xl"
                  >
                    {row.name}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                    {row.label}/USD
                    {row.marginLeverage ? ` · up to ${row.marginLeverage}x margin` : ""}
                  </p>
                </div>
              </div>
            </div>
            <svg
              viewBox="0 0 280 64"
              className="hidden h-14 w-40 shrink-0 sm:block"
              aria-hidden
              preserveAspectRatio="none"
            >
              <path
                d={path}
                fill="none"
                stroke={up ? "rgb(52 211 153)" : "rgb(251 113 133)"}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">Last</div>
                <div className="mt-0.5 text-2xl font-medium tabular-nums tracking-tight text-[var(--text-primary)]">
                  {formatMarketPrice(row.price)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">24h</div>
                <div
                  className={`mt-0.5 text-base font-medium tabular-nums ${changeTone(row.changePct)}`}
                >
                  {formatChangePct(row.changePct)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">Volume</div>
                <div className="mt-0.5 text-base font-medium tabular-nums text-[var(--text-primary)]">
                  {formatVolume(row.volume)}
                </div>
              </div>
            </div>
            <span className="inline-flex h-9 items-center rounded-lg bg-[var(--mkt-cta-bg)] px-4 text-[13px] font-medium text-[var(--mkt-cta-fg)] group-hover:opacity-90">
              Trade
            </span>
          </div>
        </Link>

        {peek ? <PeekCard row={peek} /> : null}
      </div>
    </section>
  );
}
