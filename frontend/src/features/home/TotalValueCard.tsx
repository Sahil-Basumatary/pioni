import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDownSmallIcon,
  ConvertVerticalIcon,
  DepositIcon,
  StakeIcon,
  WithdrawIcon,
} from "../../components/shell/shellIcons";
import { useConvert } from "../convert/ConvertContext";
import type { PnlChartPoint } from "../portfolio/portfolioApi";
import EquityChart from "./EquityChart";

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y";

export const RANGE_DAYS: Record<ChartRange, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y"];

type TotalValueCardProps = {
  totalValue: number | null;
  points: PnlChartPoint[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  loading?: boolean;
};

export default function TotalValueCard({
  totalValue,
  points,
  range,
  onRangeChange,
  loading,
}: TotalValueCardProps) {
  const { openConvert } = useConvert();
  const value = totalValue ?? 0;
  const display = totalValue == null ? "—" : formatAmount(value);
  const change = computeChange(points, value);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <section className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs text-[var(--text-muted)]">Total value</span>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="rail-icon flex h-7 items-center gap-1 rounded-lg bg-black/[0.06] px-2 text-xs font-medium text-[var(--text-muted)]"
              >
                {range}
                <ChevronDownSmallIcon className="h-4 w-4" />
              </button>
              {open && (
                <ul
                  role="listbox"
                  className="absolute right-0 z-20 mt-1 min-w-[4.5rem] overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[var(--shadow-card)]"
                >
                  {RANGES.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={r === range}
                        className={`rail-icon block w-full px-3 py-1.5 text-left text-xs ${
                          r === range
                            ? "bg-black/[0.06] font-medium text-[var(--text-primary)]"
                            : "text-[var(--text-muted)] hover:bg-black/[0.04]"
                        }`}
                        onClick={() => {
                          onRangeChange(r);
                          setOpen(false);
                        }}
                      >
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-medium leading-none text-[var(--text-primary)]">
              {loading ? "…" : display}
            </span>
            <span className="text-xs font-medium text-[var(--text-muted)]">USD</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {change ? (
              <>
                <span
                  className={`font-medium ${
                    change.amount >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {change.amount >= 0 ? "+" : ""}
                  {formatAmount(change.amount)}&nbsp;USD
                </span>
                <span
                  className={`font-medium ${
                    change.amount >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  ({change.pct >= 0 ? "+" : ""}
                  {change.pct.toFixed(2)}%)
                </span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">—</span>
            )}
            <span className="text-[var(--text-muted)] underline decoration-dashed underline-offset-4">
              last {range}
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-4 px-4 py-2">
          <ActionLink to="/deposit" label="Deposit" icon={<DepositIcon className="h-4 w-4" />} />
          <ActionLink to="/deposit" label="Withdraw" icon={<WithdrawIcon className="h-4 w-4" />} />
          <ActionButton
            label="Convert"
            icon={<ConvertVerticalIcon className="h-4 w-4" />}
            onClick={() => openConvert()}
          />
          <ActionLink to="/earn" label="Earn" icon={<StakeIcon className="h-4 w-4" />} />
        </div>
        <EquityChart points={points} fallbackValue={value} days={RANGE_DAYS[range]} />
      </div>
    </section>
  );
}

function ActionLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex h-8 items-center justify-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    >
      {icon}
      {label}
    </Link>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center justify-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    >
      {icon}
      {label}
    </button>
  );
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function computeChange(
  points: PnlChartPoint[],
  current: number,
): { amount: number; pct: number } | null {
  if (!Number.isFinite(current)) return null;
  if (points.length >= 2) {
    const first = Number(points[0].total_value);
    const last = Number(points[points.length - 1].total_value);
    if (!Number.isFinite(first) || first === 0) return null;
    const amount = last - first;
    return { amount, pct: (amount / first) * 100 };
  }
  return { amount: 0, pct: 0 };
}
