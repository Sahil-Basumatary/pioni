import { useState } from "react";
import type { PortfolioTrade } from "../../features/portfolio/portfolioApi";
import {
  assetIconUrl,
  baseAsset,
  formatActivityClock,
  formatActivityDate,
  formatTradeHeadline,
  tradeDetailParts,
} from "../../components/shell/activityFormat";

export function ActivityFillRow({ trade }: { trade: PortfolioTrade }) {
  const parts = tradeDetailParts(trade.side, trade.quantity, trade.price, trade.symbol);
  const isBuy = trade.side === "BUY";
  const asset = baseAsset(trade.symbol);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <li>
      <button
        type="button"
        className="rail-icon flex w-full flex-row justify-between gap-3 rounded-lg p-2 text-left hover:bg-black/[0.03]"
      >
        <div className="flex min-w-0 flex-grow flex-row items-center gap-3">
          <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--bg)]">
            {!imgFailed ? (
              <img
                src={assetIconUrl(trade.symbol)}
                alt=""
                width={24}
                height={24}
                className="absolute inset-0 size-full rounded-full object-scale-down"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                {asset.slice(0, 1)}
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-grow flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">
              {formatTradeHeadline(trade.side, trade.symbol)}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              <span className={isBuy ? "text-emerald-600" : "text-rose-500"}>
                {parts.sideLabel}
              </span>{" "}
              <span>{parts.quantity}</span> <span>{parts.asset}</span>{" "}
              <span className="font-normal text-[var(--text-muted)]">@</span>{" "}
              <span>
                {parts.price}
                <span className="text-[var(--text-muted)]">{parts.quote}</span>
              </span>
            </span>
          </div>
        </div>
        <time
          dateTime={trade.executed_at}
          className="inline-flex shrink-0 flex-col items-end gap-1 whitespace-nowrap text-xs font-semibold text-[var(--text-muted)]"
        >
          <span>{formatActivityDate(trade.executed_at)}</span>
          <span>{formatActivityClock(trade.executed_at)}</span>
        </time>
      </button>
    </li>
  );
}
