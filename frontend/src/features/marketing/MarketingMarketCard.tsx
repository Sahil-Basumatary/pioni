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
  row: LiveMarketRow;
};

export default function MarketingMarketCard({ row }: Props) {
  const up = row.changePct != null && row.changePct >= 0;
  const path = sparklinePath(sparklinePoints(row.changePct, row.symbol, 16), 72, 26);

  return (
    <Link
      to={deskPath(row.symbol)}
      data-mkt="market-card"
      className="marketing-market-card group flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2.5 shadow-[var(--shadow-card)] transition hover:border-[var(--mkt-ink-500)] hover:bg-[var(--mkt-hover)]"
    >
      <img
        src={assetIconUrl(row.symbol)}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-white object-scale-down"
      />
      <div className="min-w-0 flex-1">
        <div
          data-mkt="market-name"
          className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]"
        >
          {row.name}
        </div>
        <div className="mt-0.5 truncate text-[11px] leading-tight text-[var(--text-muted)]">
          {row.label}/USD · {formatVolume(row.volume)}
        </div>
      </div>
      <svg
        viewBox="0 0 72 26"
        className="hidden h-6 w-[72px] shrink-0 sm:block"
        aria-hidden
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke={up ? "rgb(52 211 153)" : "rgb(251 113 133)"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
