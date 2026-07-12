import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  useGetMyTradesQuery,
  type PortfolioTrade,
} from "../../features/portfolio/portfolioApi";
import {
  assetIconUrl,
  baseAsset,
  formatActivityClock,
  formatActivityDate,
  formatTradeHeadline,
  tradeDetailParts,
} from "./activityFormat";
import { CloseIcon, TablePinIcon, BellIcon } from "./krakenIcons";

type InboxTab = "inbox" | "alerts";

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<InboxTab>("inbox");
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: 30 },
    { skip: !isSignedIn || tab !== "inbox" },
  );

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="flex h-full w-full max-w-[450px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0px_4px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-4">
        <span className="text-sm font-medium text-[var(--text-muted)]">Notifications</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Pin"
            title="Pin"
            className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
          >
            <TablePinIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={onClose}
            className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex shrink-0 gap-0 px-4 pb-3">
        <TabChip
          label="Inbox"
          active={tab === "inbox"}
          onClick={() => setTab("inbox")}
          side="start"
        />
        <TabChip
          label="Manage alerts"
          active={tab === "alerts"}
          onClick={() => setTab("alerts")}
          side="end"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {tab === "alerts" ? (
          <EmptyState
            title="No alerts yet"
            body="Price and order alerts will show up here once you create them."
          />
        ) : !isSignedIn ? (
          <EmptyState
            title="You are all caught up!"
            body="Sign in from the top bar to see your paper fills and alerts here."
          />
        ) : isLoading ? (
          <EmptyState title="Loading…" body="Fetching your recent fills." />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">Couldn’t load inbox.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : !data?.length ? (
          <EmptyState
            title="You are all caught up!"
            body="Your updates and alerts will show up here"
          />
        ) : (
          <ul className="flex list-none flex-col">
            {data.map((trade) => (
              <FillRow key={trade.id} trade={trade} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TabChip({
  label,
  active,
  onClick,
  side,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  side: "start" | "end";
}) {
  const radius =
    side === "start" ? "rounded-s-xl rounded-e-lg" : "rounded-e-xl rounded-s-lg";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rail-icon px-2 py-1.5 text-xs font-medium ${radius} ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-[var(--text-muted)]">
        <BellIcon className="h-8 w-8" />
      </span>
      <p className="text-base font-medium text-[var(--text-primary)]">{title}</p>
      <p className="text-sm text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

function FillRow({ trade }: { trade: PortfolioTrade }) {
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
              <span>{parts.quantity}</span>{" "}
              <span>{parts.asset}</span>{" "}
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
