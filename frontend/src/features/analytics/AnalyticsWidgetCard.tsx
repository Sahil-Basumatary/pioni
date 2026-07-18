import { useState, type ReactNode } from "react";
import { ChevronDownSmallIcon } from "../../components/shell/shellIcons";
import {
  ANALYTICS_INTERVALS,
  ANALYTICS_OVERFLOW_INTERVALS,
  type AnalyticsInterval,
} from "./analyticsConfig";

type Props = {
  title: string;
  interval: AnalyticsInterval;
  onIntervalChange: (interval: AnalyticsInterval) => void;
  children?: ReactNode;
};

export default function AnalyticsWidgetCard({
  title,
  interval,
  onIntervalChange,
  children,
}: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflow = ANALYTICS_OVERFLOW_INTERVALS[0];

  return (
    <section className="flex h-[400px] flex-col rounded-2xl bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-normal text-[var(--text-primary)]">{title}</h2>
        <div className="flex items-center gap-1">
          <div
            role="tablist"
            aria-label={`${title} interval`}
            className="flex gap-0 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
          >
            {ANALYTICS_INTERVALS.map((item) => {
              const active = item === interval;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onIntervalChange(item)}
                  className={`rail-icon box-border h-7 min-w-[36px] rounded-[10px] px-2 text-xs font-medium ${
                    active
                      ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
                      : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-expanded={overflowOpen}
              onClick={() => setOverflowOpen((v) => !v)}
              className={`rail-icon inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-xs font-medium ${
                interval === overflow
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {overflow}
              <ChevronDownSmallIcon className="h-3.5 w-3.5" />
            </button>
            {overflowOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[64px] rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[var(--shadow-card)]">
                <button
                  type="button"
                  className="rail-icon block w-full px-3 py-1.5 text-left text-xs text-[var(--text-primary)] hover:bg-black/[0.04]"
                  onClick={() => {
                    onIntervalChange(overflow);
                    setOverflowOpen(false);
                  }}
                >
                  {overflow}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
