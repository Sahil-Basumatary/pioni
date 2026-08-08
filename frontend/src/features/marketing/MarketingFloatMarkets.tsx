import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { formatChangePct, formatMarketPrice, formatVolume } from "../markets/format";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import {
  changeTone,
  highestActivity,
  newestListed,
  topMovers,
  type LiveMarketRow,
  type MarketingChipId,
} from "./marketingLiveRows";

const HUBS = [
  {
    id: "spot",
    title: "Spot desk",
    body: "Live pairs, charts, and an order book with simulated funds",
    href: "/trading",
  },
  {
    id: "margin",
    title: "Margin practice",
    body: "Learn leveraged order flow without risking a deposit",
    href: "/trading",
  },
  {
    id: "watch",
    title: "Majors",
    body: "BTC, ETH, and SOL stay one click from the ticket",
    href: "/trading",
  },
] as const;

type Props = {
  rows: LiveMarketRow[];
  chip: MarketingChipId;
};

function RailCard({ row }: { row: LiveMarketRow }) {
  return (
    <Link
      to="/trading"
      data-mkt="rail-card"
      className="flex min-w-[200px] flex-1 items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--mkt-elevation-mid)]"
    >
      <img
        src={assetIconUrl(row.symbol)}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-white object-scale-down"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {row.label}
          </span>
          <span className={`shrink-0 text-xs font-medium tabular-nums ${changeTone(row.changePct)}`}>
            {formatChangePct(row.changePct)}
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs tabular-nums text-[var(--text-muted)]">
          <span>{formatMarketPrice(row.price)}</span>
          <span>{formatVolume(row.volume)}</span>
        </div>
      </div>
    </Link>
  );
}

function Rail({
  title,
  rows,
}: {
  title: string;
  rows: LiveMarketRow[];
}) {
  if (!rows.length) return null;
  return (
    <div data-mkt="market-rail" className="mt-9">
      <div className="flex items-end justify-between gap-4">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
        <Link
          to="/trading"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          View all
        </Link>
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {rows.map((row) => (
          <RailCard key={`${title}-${row.symbol}`} row={row} />
        ))}
      </div>
    </div>
  );
}

export default function MarketingFloatMarkets({ rows, chip }: Props) {
  const movers = topMovers(rows);
  const newest = newestListed(rows);
  const activity = highestActivity(rows);
  const grid = rows.slice(0, 12);
  const chipLabel =
    chip === "all"
      ? "All markets"
      : chip === "spot"
        ? "Spot"
        : chip === "margin"
          ? "Margin"
          : chip === "Payment and value"
            ? "Payment"
            : chip;

  return (
    <section
      id="markets"
      data-mkt="float-markets"
      className="marketing-plane marketing-float scroll-mt-32 border-y border-[var(--card-border)]"
      aria-labelledby="mkt-float-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="max-w-2xl">
          <h2
            id="mkt-float-title"
            className="text-3xl type-display font-medium text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
          >
            Live markets with paper funds
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            Prices update from the public feed. Orders fill against your simulated balance.
          </p>
        </div>

        <div
          data-mkt="hubs"
          className="mt-9 grid gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {HUBS.map((hub) => (
            <Link
              key={hub.id}
              to={hub.href}
              data-mkt="hub-card"
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--mkt-elevation-mid)] transition hover:-translate-y-0.5 hover:shadow-[var(--mkt-elevation-lift)]"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {hub.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {hub.body}
              </p>
            </Link>
          ))}
        </div>

        <Rail title="Top movers" rows={movers} />
        <Rail title="New" rows={newest} />
        <Rail title="Highest activity" rows={activity} />

        <div className="mt-12">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            {chipLabel}
          </h3>
          <div className="marketing-float__grid mt-4">
            {grid.map((card) => (
              <Link
                key={card.symbol}
                to="/trading"
                data-mkt="float-card"
                className="marketing-float__card flex h-16 items-center gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--mkt-elevation-mid)]"
              >
                <img
                  src={assetIconUrl(card.symbol)}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full bg-white object-scale-down"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {card.name}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
                    <span className="truncate text-xs tabular-nums text-[var(--text-primary)]">
                      {formatMarketPrice(card.price)}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-medium tabular-nums ${changeTone(card.changePct)}`}
                    >
                      {formatChangePct(card.changePct)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-6 text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
          >
            Start paper trading
          </Link>
        </div>
      </div>
    </section>
  );
}
