import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { formatChangePct, formatMarketPrice, formatVolume } from "../markets/format";
import { deskPath } from "../markets/marketLinks";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import {
  changeTone,
  highestActivity,
  topMovers,
  type LiveMarketRow,
} from "./marketingLiveRows";

const HUBS = [
  {
    id: "spot",
    title: "Spot desk",
    body: "Market and limit orders on a live book",
    href: "/trading",
  },
  {
    id: "margin",
    title: "Margin practice",
    body: "Positions up to 10x, settled in paper",
    href: "/trade/margin",
  },
] as const;

type Props = {
  rows: LiveMarketRow[];
};

function SideRow({ row }: { row: LiveMarketRow }) {
  return (
    <Link
      to={deskPath(row.symbol)}
      data-mkt="side-row"
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-[var(--mkt-hover)]"
    >
      <img
        src={assetIconUrl(row.symbol)}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full bg-white object-scale-down"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">
          {row.name}
        </div>
        <div className="mt-0.5 text-[11px] leading-tight text-[var(--text-muted)]">
          {formatVolume(row.volume)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[13px] font-medium tabular-nums leading-tight text-[var(--text-primary)]">
          {formatMarketPrice(row.price)}
        </div>
        <div
          className={`mt-0.5 text-[11px] font-medium tabular-nums leading-tight ${changeTone(row.changePct)}`}
        >
          {formatChangePct(row.changePct)}
        </div>
      </div>
    </Link>
  );
}

function SideList({ title, rows }: { title: string; rows: LiveMarketRow[] }) {
  if (!rows.length) return null;
  return (
    <section data-mkt="side-list" className="mt-4">
      <div className="flex items-baseline justify-between gap-3 px-2">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        <Link
          to="/markets"
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          View all
        </Link>
      </div>
      <div className="mt-1 divide-y divide-[var(--card-border)]">
        {rows.map((row) => (
          <SideRow key={`${title}-${row.symbol}`} row={row} />
        ))}
      </div>
    </section>
  );
}

export default function MarketingSideRails({ rows }: Props) {
  return (
    <aside data-mkt="side-rails" className="marketing-side-rails">
      <div
        data-mkt="side-cta"
        className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Paper desk
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
          Sign up and the desk opens with practice USD already in it.
        </p>
        <Link
          to={SIGN_UP_PATH}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[var(--mkt-cta-bg)] text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
        >
          Get started
        </Link>
      </div>

      <div data-mkt="side-hubs" className="mt-3 space-y-2">
        {HUBS.map((hub) => (
          <Link
            key={hub.id}
            to={hub.href}
            data-mkt="hub-card"
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-3 shadow-[var(--shadow-card)] transition hover:bg-[var(--mkt-hover)]"
          >
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              {hub.title}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
              {hub.body}
            </p>
          </Link>
        ))}
      </div>

      <SideList title="Top movers" rows={topMovers(rows, 3)} />
      <SideList title="Highest activity" rows={highestActivity(rows, 3)} />
    </aside>
  );
}
