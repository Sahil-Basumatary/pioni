import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownSmallIcon,
  MaximizeIcon,
  MinimizeIcon,
  QuestionMarkCircleIcon,
} from "../../components/shell/shellIcons";
import type { MarketRow } from "./useMarketRows";
import {
  CATEGORY_INDICES,
  CATEGORY_RANGES,
  axisTicks,
  categorySeries,
  seriesPath,
  type CategoryIndexId,
  type CategoryRange,
} from "./categoryIndices";

type CategoryIndicesCardProps = {
  rows: MarketRow[];
};

const CHART_H = 220;
const CHART_H_MAX = 360;

export default function CategoryIndicesCard({ rows }: CategoryIndicesCardProps) {
  const [range, setRange] = useState<CategoryRange>("1D");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [hidden, setHidden] = useState<Partial<Record<CategoryIndexId, boolean>>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(280, el.clientWidth)));
    ro.observe(el);
    setWidth(Math.max(280, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!rangeOpen && !helpOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rangeOpen && menuRef.current && !menuRef.current.contains(t)) setRangeOpen(false);
      if (helpOpen && helpRef.current && !helpRef.current.contains(t)) setHelpOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [rangeOpen, helpOpen]);

  const series = useMemo(
    () =>
      CATEGORY_INDICES.map((def) => ({
        def,
        values: categorySeries(def, rows, range),
      })),
    [rows, range],
  );

  const visibleSeries = series.filter((s) => !hidden[s.def.id]);
  const allValues = visibleSeries.flatMap((s) => s.values);
  const min = allValues.length ? Math.min(...allValues) : -3;
  const max = allValues.length ? Math.max(...allValues) : 7;
  const ticks = axisTicks(min, max);
  const chartH = maximized ? CHART_H_MAX : CHART_H;
  const plotW = Math.max(200, width - 44);

  return (
    <div className="border-b border-[var(--card-border)]">
      <div className="m-3 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-muted)]">Category indices</span>
        <div className="relative" ref={helpRef}>
          <button
            type="button"
            aria-label="About category indices"
            aria-expanded={helpOpen}
            onClick={() => setHelpOpen((v) => !v)}
            className="rail-icon flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </button>
          {helpOpen && (
            <div className="absolute left-0 top-7 z-20 w-56 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-xs leading-relaxed text-[var(--text-muted)] shadow-[var(--shadow-card)]">
              Paper category performance derived from listed spot markets. Not live index NAV.
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Select time scale"
              aria-haspopup="listbox"
              aria-expanded={rangeOpen}
              onClick={() => setRangeOpen((v) => !v)}
              className="rail-icon inline-flex h-7 items-center gap-1 rounded-lg bg-black/[0.06] px-2 text-xs font-medium text-[var(--text-muted)]"
            >
              {range}
              <ChevronDownSmallIcon className="h-4 w-4" />
            </button>
            {rangeOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-1 min-w-[4.5rem] overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[var(--shadow-card)]"
              >
                {CATEGORY_RANGES.map((r) => (
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
                        setRange(r);
                        setRangeOpen(false);
                      }}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            aria-label={maximized ? "Minimize" : "Maximize"}
            onClick={() => setMaximized((v) => !v)}
            className="rail-icon flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.06] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {maximized ? (
              <MinimizeIcon className="h-4 w-4" />
            ) : (
              <MaximizeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative px-3 pb-2">
        <div className="relative" style={{ height: chartH }}>
          <svg
            width="100%"
            height={chartH}
            viewBox={`0 0 ${width} ${chartH}`}
            className="overflow-visible"
            role="img"
            aria-label="Category indices chart"
          >
            {ticks.map((tick) => {
              const y =
                chartH - ((tick - min) / (max - min || 1)) * (chartH - 8) - 4;
              return (
                <g key={tick}>
                  <line
                    x1={0}
                    x2={plotW}
                    y1={y}
                    y2={y}
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth={1}
                  />
                  <text
                    x={width - 4}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-[var(--text-muted)]"
                    style={{ fontSize: 10 }}
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}
            {visibleSeries.map(({ def, values }) => (
              <path
                key={def.id}
                d={seriesPath(values, plotW, chartH, min, max)}
                fill="none"
                stroke={def.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="m-3 flex min-h-7 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_INDICES.map((def) => {
          const off = Boolean(hidden[def.id]);
          return (
            <button
              key={def.id}
              type="button"
              onClick={() =>
                setHidden((prev) => ({ ...prev, [def.id]: !prev[def.id] }))
              }
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap ${
                off ? "opacity-40" : ""
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: def.color }}
                aria-hidden
              />
              <span className="text-xs text-[var(--text-muted)]">{def.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
