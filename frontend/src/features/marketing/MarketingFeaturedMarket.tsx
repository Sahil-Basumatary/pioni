import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import {
  formatChangePct,
  formatMarketPrice,
  formatVolume,
  sparklinePath,
  sparklinePoints,
} from "../markets/format";
import {
  changeTone,
  type LiveMarketRow,
} from "./marketingLiveRows";

type Props = {
  row: LiveMarketRow | null;
};

export default function MarketingFeaturedMarket({ row }: Props) {
  if (!row) return null;
  const points = sparklinePoints(row.changePct, row.symbol, 28);
  const path = sparklinePath(points, 320, 72);
  const up = row.changePct != null && row.changePct >= 0;

  return (
    <section
      id="featured"
      data-mkt="featured"
      className="marketing-plane marketing-featured scroll-mt-32"
      aria-labelledby="mkt-featured-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          to="/trading"
          data-mkt="featured-card"
          className="marketing-featured__card group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--mkt-elevation-mid)] transition hover:shadow-[var(--mkt-elevation-lift)] sm:flex-row"
        >
          <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-between gap-8 p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Featured market
              </p>
              <div className="mt-5 flex items-center gap-3">
                <img
                  src={assetIconUrl(row.symbol)}
                  alt=""
                  className="h-11 w-11 rounded-full bg-white object-scale-down"
                />
                <div className="min-w-0">
                  <h2
                    id="mkt-featured-title"
                    className="truncate text-2xl type-display font-medium text-[var(--text-primary)] sm:text-3xl"
                  >
                    {row.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    {row.label}/USD · {row.category}
                    {row.marginLeverage
                      ? ` · ${row.marginLeverage}x margin`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Last</div>
                <div className="mt-1 text-3xl font-medium tabular-nums tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  {formatMarketPrice(row.price)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">24h</div>
                <div
                  className={`mt-1 text-xl font-medium tabular-nums ${changeTone(row.changePct)}`}
                >
                  {formatChangePct(row.changePct)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Volume</div>
                <div className="mt-1 text-xl font-medium tabular-nums text-[var(--text-primary)]">
                  {formatVolume(row.volume)}
                </div>
              </div>
            </div>
            <span className="inline-flex h-11 w-fit items-center rounded-xl bg-[var(--mkt-cta-bg)] px-5 text-sm font-medium text-[var(--mkt-cta-fg)] group-hover:opacity-90">
              Open on the desk
            </span>
          </div>
          <div className="relative z-[1] flex min-h-[140px] flex-1 items-end px-4 pb-6 sm:px-6 sm:pb-8 sm:pt-10">
            <svg
              viewBox="0 0 320 72"
              className="h-28 w-full"
              aria-hidden
              preserveAspectRatio="none"
            >
              <path
                d={path}
                fill="none"
                stroke={up ? "rgb(52 211 153)" : "rgb(251 113 133)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  );
}
