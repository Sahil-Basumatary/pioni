import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowTopRightIcon,
  ChevronDownSmallIcon,
  ChevronLeftSmallIcon,
  ChevronRightSmallIcon,
  DotsVerticalIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
  FilterIcon,
  SettingsSliderHorizontalIcon,
} from "../components/shell/shellIcons";
import SignedOutUnlock from "../features/auth/SignedOutUnlock";
import {
  BUY_ASSETS,
  EARN_PAYOUTS,
  EARN_SUMMARY,
  FOR_YOU,
  READY_ASSETS,
  formatApy,
  formatAssetQty,
  formatUsd,
} from "../features/earn/earnData";
import { useToast } from "../features/toasts/useToast";

type ReadyTab = "ready" | "buy";
type BottomTab = "payouts" | "activity";

function DashedLabel({ children }: { children: string }) {
  return (
    <span className="text-xs text-[rgb(104,107,130)] underline decoration-dashed underline-offset-4">
      {children}
    </span>
  );
}

function UsdAmount({
  value,
  size = "sm",
  tone = "primary",
}: {
  value: string;
  size?: "sm" | "lg" | "xl";
  tone?: "primary" | "positive" | "muted";
}) {
  const parts = value.replace(" USD", "").trim();
  const usdClass =
    size === "xl"
      ? "text-[20px] leading-9"
      : size === "lg"
        ? "text-xs"
        : "text-[10px]";
  const numClass =
    size === "xl"
      ? "text-[28px] font-medium leading-9"
      : size === "lg"
        ? "text-base font-medium"
        : "text-sm font-medium";
  const color =
    tone === "positive"
      ? "text-[#08844f]"
      : tone === "muted"
        ? "text-[var(--text-muted)]"
        : "text-[var(--text-primary)]";
  return (
    <span className={`tabular-nums ${color}`}>
      <span className={numClass}>{parts}</span>
      <span className={`ms-0.5 text-[rgb(104,107,130)] ${usdClass}`}>USD</span>
    </span>
  );
}

export default function EarnPage() {
  const { isSignedIn } = useAuth();
  const [autoEarn, setAutoEarn] = useState(false);
  const [readyTab, setReadyTab] = useState<ReadyTab>("ready");
  const [bottomTab, setBottomTab] = useState<BottomTab>("payouts");
  const toast = useToast();
  const flash = (msg: string) => toast(msg);
  const earnPct = autoEarn ? 100 : EARN_SUMMARY.autoEarnPct;
  const readyCount = READY_ASSETS.length;
  const buyCount = BUY_ASSETS.length;

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex w-full max-w-[1750px] flex-col">
        <SignedOutUnlock size="page" showLogo />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-2 pb-16 pt-1 text-[var(--text-primary)]">
      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] p-3 shadow-[0_1px_4px_rgba(16,24,40,0.04)] sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col">
            <DashedLabel>Earn balance</DashedLabel>
            <UsdAmount
              value={formatUsd(EARN_SUMMARY.balanceUsd)}
              size="xl"
            />
          </div>
          <button
            type="button"
            onClick={() => setAutoEarn((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(104,107,130,0.08)] px-2 py-1 text-xs font-medium text-[rgb(104,107,130)]"
            aria-pressed={autoEarn}
          >
            Auto Earn
            <span
              className="inline-block size-2 rounded-full bg-[#08844f]"
              aria-hidden
            />
          </button>
          <div className="mt-1 flex w-full flex-row flex-wrap items-start gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => flash("Paper allocate — simulated only")}
              className="flex min-h-10 w-full max-w-[240px] shrink-0 cursor-pointer flex-col justify-between self-stretch border-0 bg-transparent p-0 pb-1 text-left"
            >
              <div className="flex h-4 items-center justify-between gap-2">
                <span className="text-xs text-[rgb(104,107,130)]">
                  <span className="tabular-nums">{earnPct}%</span> earning
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <img
                    src="/icons/assets/btc.webp"
                    alt=""
                    className="size-4 rounded-full"
                    width={16}
                    height={16}
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    Allocate
                  </span>
                  <ChevronRightSmallIcon className="h-3.5 w-3.5 text-[rgb(104,107,130)]" />
                </span>
              </div>
              <div className="relative mt-[1.5px] h-1 w-full overflow-hidden rounded-full bg-[rgba(104,107,130,0.24)]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                  style={{ width: `${earnPct}%` }}
                />
              </div>
            </button>
            <div className="flex flex-col justify-between self-stretch">
              <DashedLabel>Est. annual earnings</DashedLabel>
              <div className="mt-0.5">
                <UsdAmount
                  value={formatUsd(EARN_SUMMARY.estAnnualUsd, { compact: true })}
                  size="lg"
                />
              </div>
            </div>
            <div className="flex flex-col justify-between self-stretch">
              <DashedLabel>Lifetime earnings</DashedLabel>
              <div className="mt-0.5">
                <UsdAmount value={formatUsd(EARN_SUMMARY.lifetimeUsd)} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] p-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <h2 className="mb-3 text-base font-medium">For you</h2>
        <button
          type="button"
          onClick={() => flash("Paper staking — simulated only")}
          className="flex h-[120px] w-fit min-w-[220px] max-w-[300px] flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-left hover:bg-black/[0.02]"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[rgb(104,107,130)]">{FOR_YOU.title}</span>
            <span className="text-base font-medium text-[#08844f]">
              {formatApy(FOR_YOU.apy)} APY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <img
              src="/icons/assets/btc.webp"
              alt=""
              className="h-7 w-7 rounded-full"
              width={28}
              height={28}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{FOR_YOU.assetName}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {FOR_YOU.availableLabel}
              </p>
            </div>
          </div>
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] py-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between px-3 pb-3">
          <div
            role="tablist"
            aria-label="Earn allocation"
            className="grid grid-flow-col gap-x-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
          >
            {(
              [
                ["ready", "Ready to earn"],
                ["buy", "Buy to earn"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={readyTab === id}
                onClick={() => setReadyTab(id)}
                className={`rail-icon rounded-[10px] px-3 py-1.5 text-xs font-medium ${
                  readyTab === id
                    ? "!bg-white text-[var(--text-primary)]"
                    : "!bg-transparent text-[var(--text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Options"
            onClick={() => flash("Paper earn options — coming soon")}
            className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
          >
            <SettingsSliderHorizontalIcon className="h-4 w-4" />
          </button>
        </div>

        {readyTab === "ready" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
                    <ColHeader label="Asset" filter />
                    <ColHeader label="APY" filter />
                    <ColHeader label="Available to allocate" filter />
                    <ColHeader label="Available to allocate (USD)" />
                    <ColHeader label="" />
                  </tr>
                </thead>
                <tbody>
                  {READY_ASSETS.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-[var(--card-border)] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={asset.icon}
                            alt=""
                            className="h-6 w-6 rounded-full"
                            width={24}
                            height={24}
                          />
                          <span className="font-medium">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#08844f]">
                        {formatApy(asset.apy)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatAssetQty(asset.available, asset.symbol)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatUsd(asset.availableUsd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            flash(`Paper allocate ${asset.symbol} — simulated only`)
                          }
                          className="inline-flex h-7 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-2.5 text-xs font-medium text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.14)] hover:text-[var(--text-primary)]"
                        >
                          Allocate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager label={`1 - ${readyCount} of ${readyCount}`} />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
                    <ColHeader label="Asset" filter />
                    <ColHeader label="APY" filter />
                    <ColHeader label="Price" />
                    <ColHeader label="" />
                  </tr>
                </thead>
                <tbody>
                  {BUY_ASSETS.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-[var(--card-border)] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-semibold text-[var(--text-muted)]">
                            {asset.name.slice(0, 1)}
                          </span>
                          <span className="font-medium">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#08844f]">
                        {formatApy(asset.apy)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatUsd(asset.priceUsd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            flash(`Paper buy ${asset.name} — simulated only`)
                          }
                          className="inline-flex h-7 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-2.5 text-xs font-medium text-[rgb(104,107,130)] hover:bg-[rgba(104,107,130,0.14)] hover:text-[var(--text-primary)]"
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager label={`1 - ${buyCount} of ${buyCount}`} />
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] py-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3">
          <div
            role="tablist"
            aria-label="Earn history"
            className="grid grid-flow-col gap-x-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
          >
            {(
              [
                ["payouts", "Payouts"],
                ["activity", "Activity"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={bottomTab === id}
                onClick={() => setBottomTab(id)}
                className={`rail-icon rounded-[10px] px-3 py-1.5 text-xs font-medium ${
                  bottomTab === id
                    ? "!bg-white text-[var(--text-primary)]"
                    : "!bg-transparent text-[var(--text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => flash("Paper earn history — coming with ledger")}
              className="rail-icon inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              View history
              <ArrowTopRightIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Options"
              onClick={() => flash("Paper earn options — coming soon")}
              className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
            >
              <SettingsSliderHorizontalIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[rgb(104,107,130)]">Last 30D rewards</p>
            <div className="mt-1">
              <UsdAmount
                value={formatUsd(EARN_SUMMARY.last30dUsd)}
                size="lg"
                tone="positive"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-[rgb(104,107,130)]">Next payout date</p>
            <p className="mt-1 text-base font-medium">
              {EARN_SUMMARY.nextPayoutLabel}
            </p>
          </div>
        </div>

        {bottomTab === "payouts" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
                    <ColHeader label="Asset" filter />
                    <ColHeader label="Amount" filter />
                    <ColHeader label="Amount (USD)" />
                    <ColHeader label="Date" />
                    <ColHeader label="ID" />
                  </tr>
                </thead>
                <tbody>
                  {EARN_PAYOUTS.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--card-border)] last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium">{row.asset}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatAssetQty(row.amount, "BABY")}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                        {row.amountUsd == null ? "—" : formatUsd(row.amountUsd)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        <div>{row.dateLabel}</div>
                        <div className="text-xs">{row.timeLabel}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {row.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              label={`1 - ${EARN_PAYOUTS.length} of ${EARN_PAYOUTS.length}`}
            />
          </>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            No earn activity yet. Paper allocations will show up here.
          </div>
        )}
      </section>
    </div>
  );
}

function ColHeader({
  label,
  filter = false,
}: {
  label: string;
  filter?: boolean;
}) {
  return (
    <th className="group/header relative px-4 py-2 font-medium">
      <div className="flex items-center gap-1">
        {label ? <span>{label}</span> : null}
        {label ? (
          <span className="invisible inline-flex items-center gap-0.5 group-hover/header:visible">
            <button
              type="button"
              aria-label="Column options"
              className="rail-icon rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <DotsVerticalIcon className="h-3.5 w-3.5" />
            </button>
            {filter ? (
              <button
                type="button"
                aria-label="Filter"
                className="rail-icon rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <FilterIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
    </th>
  );
}

function Pager({
  label,
  atStart = true,
  atEnd = true,
}: {
  label: string;
  atStart?: boolean;
  atEnd?: boolean;
}) {
  return (
    <div className="mx-2 mt-3 flex items-center justify-between gap-2 rounded-xl bg-[rgba(104,107,130,0.06)] px-3 py-2 text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={atStart}
          aria-label="First page"
          className="rail-icon flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
        >
          <DoubleChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={atStart}
          aria-label="Previous page"
          className="rail-icon flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
        >
          <ChevronLeftSmallIcon className="h-4 w-4" />
        </button>
        <span className="mx-1 tabular-nums text-[var(--text-primary)]">{label}</span>
        <button
          type="button"
          disabled={atEnd}
          aria-label="Next page"
          className="rail-icon flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
        >
          <ChevronRightSmallIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={atEnd}
          aria-label="Last page"
          className="rail-icon flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
        >
          <DoubleChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        className="rail-icon inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        Rows per page: <span className="text-[var(--text-primary)]">10</span>
        <ChevronDownSmallIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
