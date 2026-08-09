import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
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

const STAT_LABEL_CLASS =
  "text-[10px] uppercase tracking-wider text-[var(--text-muted)]";

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
      <path
        d="m6 3 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeekCard({ row }: { row: LiveMarketRow }) {
  return (
    <Link
      to={deskPath(row.symbol)}
      data-mkt="featured-card"
      className="hidden h-[190px] min-w-0 flex-col justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--mkt-ink-500)] hover:bg-[var(--mkt-hover)] lg:flex"
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

function FeaturedScrubber({
  count,
  index,
  onChange,
}: {
  count: number;
  index: number;
  onChange: (next: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const indexFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track || count < 2) return 0;
    const { left, width } = track.getBoundingClientRect();
    if (width <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    return Math.min(count - 1, Math.floor(ratio * count));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(indexFromClientX(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onChange(indexFromClientX(event.clientX));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange((index + 1) % count);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange((index - 1 + count) % count);
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(count - 1);
    }
  };

  const thumbPct = 100 / count;
  const leftPct = (index / count) * 100;

  return (
    <div
      ref={trackRef}
      data-mkt="featured-scrubber"
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={index}
      aria-valuetext={`${index + 1} of ${count}`}
      aria-label="Featured market position"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      className="group relative mt-3 flex h-4 cursor-pointer items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/40"
    >
      <div className="relative h-1 w-full rounded-full bg-[var(--mkt-ink-700)]">
        <div
          aria-hidden
          className="absolute inset-y-0 rounded-full bg-[var(--text-primary)] transition-[left,width] duration-300 ease-out group-active:duration-75"
          style={{ left: `${leftPct}%`, width: `${thumbPct}%` }}
        />
      </div>
    </div>
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

      <div className="mt-2.5 grid gap-3 lg:grid-cols-[1.9fr_1fr]">
        <Link
          to={deskPath(row.symbol)}
          data-mkt="featured-card"
          className="group flex h-[190px] min-w-0 flex-col justify-between gap-5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--mkt-elevation-mid)] transition hover:border-[var(--mkt-ink-500)] sm:p-5"
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
                  <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
                    {row.label}/USD
                  </p>
                </div>
              </div>
            </div>
            <svg
              viewBox="0 0 280 64"
              className="hidden h-12 w-32 shrink-0 xl:block"
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

          <dl className="grid grid-cols-[auto_auto_auto_1fr] grid-rows-[auto_auto] items-baseline gap-x-6 gap-y-0.5">
            <dt className={`${STAT_LABEL_CLASS} col-start-1 row-start-1`}>Last</dt>
            <dt className={`${STAT_LABEL_CLASS} col-start-2 row-start-1`}>24h</dt>
            <dt className={`${STAT_LABEL_CLASS} col-start-3 row-start-1`}>Volume</dt>
            <dd className="col-start-1 row-start-2 text-2xl font-medium tabular-nums tracking-tight text-[var(--text-primary)]">
              {formatMarketPrice(row.price)}
            </dd>
            <dd
              className={`col-start-2 row-start-2 text-[15px] font-medium tabular-nums ${changeTone(row.changePct)}`}
            >
              {formatChangePct(row.changePct)}
            </dd>
            <dd className="col-start-3 row-start-2 text-[15px] font-medium tabular-nums text-[var(--text-primary)]">
              {formatVolume(row.volume)}
            </dd>
            <dd className="col-start-4 row-start-2 inline-flex items-center justify-self-end gap-1 text-[13px] font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]">
              Trade
              <Chevron />
            </dd>
          </dl>
        </Link>

        {peek ? <PeekCard row={peek} /> : null}
      </div>

      {rows.length > 1 ? (
        <FeaturedScrubber count={rows.length} index={safeIndex} onChange={setIndex} />
      ) : null}
    </section>
  );
}
