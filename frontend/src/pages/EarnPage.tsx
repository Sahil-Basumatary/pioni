import { useState } from "react";
import {
  EARN_PAYOUTS,
  EARN_SUMMARY,
  FOR_YOU,
  READY_ASSETS,
  formatApy,
  formatAssetQty,
  formatUsd,
} from "../features/earn/earnData";
import { useToast } from "../features/toasts/useToast";

type BottomTab = "payouts" | "activity";

export default function EarnPage() {
  const [autoEarn, setAutoEarn] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("payouts");
  const toast = useToast();

  const flash = (msg: string) => toast(msg);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 pb-16 pt-1 text-[var(--text-primary)]">

      <section className="rounded-2xl bg-[var(--card-bg)] p-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-muted)]">Earn balance</p>
            <p className="mt-1 text-[40px] font-normal leading-[48px] tracking-tight tabular-nums">
              {formatUsd(EARN_SUMMARY.balanceUsd).replace(" USD", "")}
              <span className="text-[28px] text-[var(--text-muted)]"> USD</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoEarn((v) => !v)}
              className="rail-icon inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--card-border)] px-3 text-sm"
            >
              <span className="font-medium">Auto Earn</span>
              <span className="text-[var(--text-muted)]">
                {autoEarn ? "On" : `${EARN_SUMMARY.autoEarnPct}% earning`}
              </span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoEarn ? "bg-[var(--accent)]" : "bg-black/10"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    autoEarn ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
            <button
              type="button"
              onClick={() => flash("Paper allocate — simulated only")}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
            >
              Allocate
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Est. annual earnings</p>
            <p className="mt-1 text-base font-medium tabular-nums">
              {formatUsd(EARN_SUMMARY.estAnnualUsd, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Lifetime earnings</p>
            <p className="mt-1 text-base font-medium tabular-nums">
              {formatUsd(EARN_SUMMARY.lifetimeUsd)}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">For you</h2>
        <div className="max-w-sm rounded-2xl bg-[var(--card-bg)] p-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{FOR_YOU.title}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatApy(FOR_YOU.apy)} APY
              </p>
            </div>
            <img
              src="/icons/assets/btc.webp"
              alt=""
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
            />
          </div>
          <p className="mt-3 text-sm font-medium">{FOR_YOU.assetName}</p>
          <p className="text-xs text-[var(--text-muted)]">{FOR_YOU.availableLabel}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <h2 className="text-base font-medium">Ready to earn</h2>
          <button
            type="button"
            onClick={() => flash("Buy to earn — paper flow coming soon")}
            className="rail-icon text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Buy to earn
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">APY</th>
                <th className="px-4 py-3 font-medium">Available to allocate</th>
                <th className="px-4 py-3 font-medium">Available to allocate (USD)</th>
                <th className="px-4 py-3 font-medium" />
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
                  <td className="px-4 py-3 tabular-nums">{formatApy(asset.apy)}</td>
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
                      className="inline-flex h-7 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-2.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[rgba(104,107,130,0.14)] hover:text-[var(--text-primary)]"
                    >
                      Allocate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-[var(--card-bg)] shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3">
          <div className="inline-flex gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1">
            {(
              [
                ["payouts", "Payouts"],
                ["activity", "Activity"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
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
          <button
            type="button"
            onClick={() => flash("Paper earn history — coming with ledger")}
            className="rail-icon text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            View history
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Last 30D rewards</p>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {formatUsd(EARN_SUMMARY.last30dUsd)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Next payout date</p>
            <p className="mt-1 text-sm font-medium">{EARN_SUMMARY.nextPayoutLabel}</p>
          </div>
        </div>

        {bottomTab === "payouts" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-[var(--card-border)] text-left text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Amount (USD)</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">ID</th>
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
        ) : (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            No earn activity yet. Paper allocations will show up here.
          </div>
        )}
      </section>
    </div>
  );
}
