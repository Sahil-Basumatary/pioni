import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useGetMyTradesQuery } from "../portfolio/portfolioApi";
import { SettingsSliderHorizontalIcon } from "../../components/shell/shellIcons";
import {
  assetIconUrl,
  formatActivityClock,
  formatActivityDate,
} from "../../components/shell/activityFormat";
import { ActivityFillRow } from "./ActivityFillRow";
import { PAPER_HOME_ACTIVITY, type PaperActivityItem } from "./paperHomeDemo";

const PREVIEW_LIMIT = 5;

export default function HomeActivity() {
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useGetMyTradesQuery(
    { limit: PREVIEW_LIMIT },
    { skip: !isSignedIn },
  );

  const liveItems: PaperActivityItem[] | null =
    isSignedIn && data && data.length > 0
      ? data.map((trade) => ({ kind: "fill" as const, id: trade.id, trade }))
      : null;
  const items = liveItems ?? PAPER_HOME_ACTIVITY;
  const showLiveError = Boolean(isSignedIn && isError && !isLoading);

  return (
    <section className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Activity</span>
        </div>
        <button
          type="button"
          aria-label="Options"
          className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
        >
          <SettingsSliderHorizontalIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {showLiveError && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-black/[0.04] px-2.5 py-2">
            <p className="text-xs text-[var(--text-muted)]">
              Live activity unavailable — showing paper preview.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="shrink-0 rounded-md bg-[var(--accent)] px-2 py-1 text-[11px] font-medium text-white"
            >
              Retry
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isSignedIn && isLoading ? (
            <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">Loading…</p>
          ) : (
            <ul className="flex list-none flex-col -mx-2">
              {items.map((item) =>
                item.kind === "fill" ? (
                  <ActivityFillRow key={item.id} trade={item.trade} />
                ) : (
                  <ActivityWithdrawalRow key={item.id} item={item} />
                ),
              )}
            </ul>
          )}
        </div>
        <Link
          to="/history"
          className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-black/[0.06] px-3 text-sm font-medium text-[var(--text-muted)] hover:bg-black/[0.09] hover:text-[var(--text-primary)]"
        >
          See all activity
        </Link>
      </div>
    </section>
  );
}

function ActivityWithdrawalRow({
  item,
}: {
  item: Extract<PaperActivityItem, { kind: "withdrawal" }>;
}) {
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
                src={assetIconUrl(item.asset)}
                alt=""
                width={24}
                height={24}
                className="absolute inset-0 size-full rounded-full object-scale-down"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                {item.asset.slice(0, 1)}
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-grow flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">
              {item.asset} withdrawal
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              <span className="text-rose-500">−{item.amount}</span> {item.asset}{" "}
              <span className="font-normal text-[var(--text-muted)]">≈</span>{" "}
              <span>
                {item.quoteAmount}
                <span className="text-[var(--text-muted)]">USD</span>
              </span>
            </span>
          </div>
        </div>
        <time
          dateTime={item.at}
          className="inline-flex shrink-0 flex-col items-end gap-1 whitespace-nowrap text-xs font-semibold text-[var(--text-muted)]"
        >
          <span>{formatActivityDate(item.at)}</span>
          <span>{formatActivityClock(item.at)}</span>
        </time>
      </button>
    </li>
  );
}
