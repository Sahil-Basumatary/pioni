import { useEffect, useMemo, useRef, useState } from "react";
import { MaximizeIcon, MinimizeIcon } from "../../components/shell/shellIcons";
import type { MarketRow } from "./useMarketRows";
import {
  buildHeatData,
  formatHeatValue,
  heatFill,
  layoutTreemap,
  type HeatMetric,
} from "./categoryHeatmap";
import { formatChangePct } from "./format";

type CategoryHeatmapCardProps = {
  rows: MarketRow[];
};

const BASE_H = 322;
const MAX_H = 480;

export default function CategoryHeatmapCard({ rows }: CategoryHeatmapCardProps) {
  const [metric, setMetric] = useState<HeatMetric>("volume");
  const [scaled, setScaled] = useState(true);
  const [maximized, setMaximized] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(349);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(240, el.clientWidth)));
    ro.observe(el);
    setWidth(Math.max(240, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const height = maximized ? MAX_H : BASE_H;
  const data = useMemo(() => buildHeatData(rows, metric), [rows, metric]);
  const cells = useMemo(
    () => layoutTreemap(data, width, height, 2),
    [data, width, height],
  );

  return (
    <div className="w-full border-l border-[rgba(104,107,130,0.12)]">
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm font-medium text-[rgb(104,107,130)]">
          Category indices heatmap
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              role="switch"
              aria-label="Scaled"
              checked={scaled}
              onChange={(e) => setScaled(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-4 w-6 rounded-full bg-black/[0.12] after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-2" />
            Scaled
          </label>
          <div
            role="tablist"
            className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-black/[0.06] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={metric === "volume"}
              onClick={() => setMetric("volume")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                metric === "volume"
                  ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metric === "mcap"}
              onClick={() => setMetric("mcap")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                metric === "mcap"
                  ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Market cap
            </button>
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
      <div
        ref={wrapRef}
        className="relative w-full px-3 pb-3"
        style={{ height: height + 12, minHeight: height + 12 }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            role="img"
            aria-label="Category indices heatmap"
          >
            <rect width={width} height={height} fill="var(--bg)" />
            {cells.map((cell) => (
              <rect
                key={cell.id}
                x={cell.x}
                y={cell.y}
                width={cell.w}
                height={cell.h}
                fill={heatFill(cell.changePct, scaled)}
              />
            ))}
          </svg>
          {cells.map((cell) => {
            if (cell.w < 32 || cell.h < 28) return null;
            const showDot = cell.w >= 48 && cell.h >= 56;
            const showValue = cell.w >= 56 && cell.h >= 52;
            const showChange = cell.w >= 56 && cell.h >= 68 && cell.changePct != null;
            const changeColor =
              cell.changePct == null
                ? "rgba(104,107,130,0.8)"
                : cell.changePct >= 0
                  ? "rgb(8, 132, 79)"
                  : "rgb(200, 40, 70)";
            return (
              <div
                key={`${cell.id}-label`}
                className="pointer-events-none absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden p-1"
                style={{
                  left: cell.x,
                  top: cell.y,
                  width: cell.w,
                  height: cell.h,
                }}
              >
                {showDot ? (
                  <span
                    className="mb-0.5 h-5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: cell.color }}
                    aria-hidden
                  />
                ) : null}
                <div
                  className="w-full truncate text-center text-xs font-medium leading-4 text-[rgb(16,17,20)]"
                >
                  {cell.label}
                </div>
                {showValue ? (
                  <div className="w-full truncate text-center text-[10px] font-medium leading-[10px] text-[rgba(104,107,130,0.8)]">
                    {formatHeatValue(cell.value)}
                  </div>
                ) : null}
                {showChange ? (
                  <div
                    className="w-full truncate text-center text-[10px] font-medium leading-[10px]"
                    style={{ color: changeColor }}
                  >
                    {formatChangePct(cell.changePct)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
