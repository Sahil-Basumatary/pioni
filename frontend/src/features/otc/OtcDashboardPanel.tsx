import { useState } from "react";
import { Link } from "react-router-dom";
import { assetIconUrl } from "../../components/shell/activityFormat";
import { sparklinePath, sparklinePoints } from "../markets/format";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import {
  OTC_OVERALL_EXPOSURE_USD,
  OTC_RFQ_EXPOSURE_USD,
  formatOtcUsd,
} from "./otcPortalContent";

function CoinCard({
  name,
  ticker,
  symbol,
  iconSrc,
  fallback,
}: {
  name: string;
  ticker: string;
  symbol: string;
  iconSrc: string;
  fallback: number;
}) {
  const live = useLiveMarketTrade(symbol);
  const px = Number(live?.price);
  const price = Number.isFinite(px) && px > 0 ? px : fallback;
  const points = sparklinePoints(0.4, symbol, 32);
  const d = sparklinePath(points, 384, 92);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-[rgba(148,151,169,0.08)] p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {imgFailed ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[10px] font-semibold text-[var(--text-muted)]">
              {ticker.slice(0, 1)}
            </span>
          ) : (
            <img
              src={iconSrc}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-full object-scale-down"
              onError={() => setImgFailed(true)}
            />
          )}
          <p className="text-sm">
            <span className="font-medium">{name}</span>
            <span className="ms-1 text-[var(--text-muted)]">{ticker}</span>
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium">
          {price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          USD
        </p>
      </div>
      <svg
        viewBox="0 0 384 92"
        className="mt-2 h-[92px] w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={`${d} L384 92 L0 92 Z`}
          fill="rgba(148,151,169,0.16)"
          stroke="none"
        />
        <path d={d} fill="none" stroke="rgb(104,107,130)" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

export default function OtcDashboardPanel() {
  const [loanTab, setLoanTab] = useState<"Active" | "Closed">("Active");

  return (
    <div className="grid gap-2 lg:grid-cols-12">
      <div className="flex flex-col gap-2 lg:col-span-8">
        <section
          className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-[var(--card-bg)] p-4 sm:flex-row sm:items-center"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <div className="grid w-full gap-6 sm:grid-cols-2 sm:w-auto sm:flex-1">
            <div>
              <p className="mb-1 w-fit border-b border-dashed border-[var(--text-muted)] pb-0.5 text-sm text-[var(--text-muted)]">
                Total traded (YTD)
              </p>
              <p className="text-2xl font-medium tracking-tight">
                0.00<span className="text-[var(--text-muted)]">USD</span>
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm text-[var(--text-muted)]">
                Trading activity (YTD)
              </p>
              <p className="text-2xl font-medium tracking-tight">
                0<span className="text-[var(--text-muted)]">trades</span>
              </p>
            </div>
          </div>
          <Link
            to="/otc/portal"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-3 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
          >
            Request for quote
          </Link>
        </section>
        <section
          className="rounded-2xl bg-[var(--card-bg)] p-4"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <div className="mb-4 flex items-center justify-between gap-1">
            <h2 className="text-base font-medium">Most traded coins</h2>
            <button
              type="button"
              className="rounded-lg bg-[rgba(104,107,130,0.08)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
            >
              1W
            </button>
          </div>
          <div className="flex flex-col gap-4 md:flex-row">
            <CoinCard
              name="Bitcoin"
              ticker="BTC"
              symbol="BTCUSDT"
              iconSrc={assetIconUrl("BTCUSDT")}
              fallback={64348.9}
            />
            <CoinCard
              name="Ether"
              ticker="ETH"
              symbol="ETHUSDT"
              iconSrc={assetIconUrl("ETHUSDT")}
              fallback={1860.01}
            />
          </div>
        </section>
        <section
          className="rounded-2xl bg-[var(--card-bg)] p-4"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Loans</h2>
            <div className="flex gap-1 rounded-lg bg-[rgba(104,107,130,0.08)] p-0.5">
              {(["Active", "Closed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLoanTab(t)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    loanTab === t
                      ? "bg-[var(--card-bg)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No loans available.
          </p>
        </section>
        <section
          className="rounded-2xl bg-[var(--card-bg)] p-4"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <h2 className="mb-3 text-base font-medium">Recent transactions</h2>
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No trades available.
          </p>
        </section>
      </div>
      <div className="flex flex-col gap-2 lg:col-span-4">
        <section
          className="rounded-2xl bg-[var(--card-bg)] p-4"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <h2 className="mb-3 text-base font-medium">Your top traded assets</h2>
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No traded coins available
          </p>
        </section>
        <section
          className="rounded-2xl bg-[var(--card-bg)] p-4"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <h2 className="mb-3 text-base font-medium">Exposure</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)]">Available RFQ exposure</span>
              <span className="font-medium">{formatOtcUsd(OTC_RFQ_EXPOSURE_USD)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)]">
                Available overall OTC exposure
              </span>
              <span className="font-medium">
                {formatOtcUsd(OTC_OVERALL_EXPOSURE_USD)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
