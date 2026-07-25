import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../../components/shell/shellIcons";

type PortfolioInsightsProps = {
  totalValue: number | null;
  availableMargin: number | null;
  unrealizedPnl: number | null;
};

type InsightRow = {
  label: string;
  value: string;
  suffix?: string;
  tone?: "pos" | "neg" | "muted";
};

export default function PortfolioInsights({
  totalValue,
  availableMargin,
  unrealizedPnl,
}: PortfolioInsightsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const tv = fmt(totalValue);
  const margin = fmt(availableMargin);
  const upnl = fmt(unrealizedPnl);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanPrev(el.scrollLeft > 2);
      setCanNext(max - el.scrollLeft > 2);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, []);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 240), behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center overflow-hidden">
      <div
        ref={scrollerRef}
        className="flex min-w-0 flex-grow overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max min-w-full flex-grow flex-col gap-2 sm:flex-row sm:gap-1">
          <div className="flex flex-col gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1 sm:flex-row sm:[&>*]:min-w-60">
            <InsightTile
              title="Main"
              to="/home"
              elevated={false}
              rows={[
                { label: "Total value", value: tv, suffix: "USD" },
                { label: "Available margin", value: margin, suffix: "USD" },
              ]}
            />
            <InsightTile
              title="Spot"
              to="/trading"
              elevated
              rows={[
                { label: "Balance value", value: tv, suffix: "USD" },
                {
                  label: "Balances UP&L",
                  value: upnl,
                  suffix: "USD",
                  tone:
                    unrealizedPnl == null || unrealizedPnl === 0
                      ? undefined
                      : unrealizedPnl > 0
                        ? "pos"
                        : "neg",
                },
              ]}
            />
            <InsightTile
              title="Margin"
              badge="Healthy"
              to="/trade/margin"
              elevated
              rows={[
                { label: "Positions UP&L", value: "-", tone: "muted" },
                { label: "Used margin", value: "0.00", suffix: "USD" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1 sm:flex-row sm:[&>*]:min-w-60">
            <InsightTile
              title="Inverse Futures"
              to="/trade/futures"
              elevated={false}
              rows={[
                { label: "Balance value", value: "-", suffix: "USD", tone: "muted" },
                { label: "Positions UP&L", value: "-", suffix: "USD", tone: "muted" },
              ]}
            />
          </div>
        </div>
      </div>
      {(canPrev || canNext) && (
        <div className="pointer-events-none absolute inset-y-0 flex w-full items-center">
          {canPrev ? (
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollByPage(-1)}
              className="pointer-events-auto mr-auto inline-flex size-7 items-center justify-center rounded-lg bg-[rgb(222,222,229)] text-[rgb(104,107,130)] hover:bg-[rgb(210,210,218)]"
            >
              <ArrowRightIcon className="size-4 rotate-180" />
            </button>
          ) : null}
          {canNext ? (
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollByPage(1)}
              className="pointer-events-auto ml-auto inline-flex size-7 items-center justify-center rounded-lg bg-[rgb(222,222,229)] text-[rgb(104,107,130)] hover:bg-[rgb(210,210,218)]"
            >
              <ArrowRightIcon className="size-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function InsightTile({
  title,
  badge,
  to,
  elevated,
  rows,
}: {
  title: string;
  badge?: string;
  to: string;
  elevated: boolean;
  rows: InsightRow[];
}) {
  return (
    <Link
      to={to}
      className={`box-border w-full rounded-xl px-0 py-3 text-start ${
        elevated
          ? "bg-[var(--card-bg)] hover:bg-[var(--card-bg)]"
          : "bg-transparent hover:bg-[var(--card-bg)]"
      }`}
    >
      <div className="h-full min-w-[160px] px-3">
        <div className="flex flex-row items-center gap-x-2">
          <div className="flex flex-1 items-center gap-1">
            <span className="text-sm font-medium leading-5 text-[rgb(16,17,20)]">
              {title}
            </span>
          </div>
          {badge ? (
            <span className="inline-flex items-center rounded-md bg-[rgba(20,158,97,0.16)] px-1 py-px text-[10px] leading-[14px] text-[rgb(2,107,63)]">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col whitespace-nowrap">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex w-full items-center justify-between gap-x-2"
            >
              <span className="text-xs leading-4 text-[rgb(104,107,130)]">
                {row.label}
              </span>
              <span className="inline-flex items-end tabular-nums">
                <span
                  className={`text-xs leading-4 ${
                    row.tone === "pos"
                      ? "font-medium text-emerald-600"
                      : row.tone === "neg"
                        ? "font-medium text-[rgb(209,29,69)]"
                        : row.tone === "muted"
                          ? "font-medium text-[rgb(104,107,130)]"
                          : "font-medium text-[rgb(16,17,20)]"
                  }`}
                >
                  {row.value}
                </span>
                {row.suffix ? (
                  <span className="ms-0.5 text-xs leading-4 text-[rgb(104,107,130)]">
                    {row.suffix}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function fmt(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
