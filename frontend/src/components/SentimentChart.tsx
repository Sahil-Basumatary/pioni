import { useMemo } from "react";
import type { HistoryPoint } from "../types/sentiment";

interface SentimentChartProps {
  data: HistoryPoint[];
}

interface ChartGeometry {
  line: string;
  area: string;
  dots: Array<{ x: number; y: number; score: number }>;
  min: number;
  max: number;
  latest: number;
  delta: number;
}

const CHART = {
  left: 4,
  right: 96,
  top: 8,
  bottom: 66,
} as const;

function formatDateLabel(raw: string): string {
  const [, month, day] = raw.split("-");
  return month && day ? `${month}/${day}` : raw;
}

function buildGeometry(points: HistoryPoint[]): ChartGeometry {
  if (points.length === 0) {
    return { line: "", area: "", dots: [], min: -1, max: 1, latest: 0, delta: 0 };
  }

  const scores = points.map((point) => point.score);
  const rawMin = Math.min(...scores, 0);
  const rawMax = Math.max(...scores, 0);
  const padding = Math.max((rawMax - rawMin) * 0.22, 0.08);
  const min = Math.max(-1, rawMin - padding);
  const max = Math.min(1, rawMax + padding);
  const range = max - min || 1;
  const lastIndex = Math.max(points.length - 1, 1);
  const height = CHART.bottom - CHART.top;
  const width = CHART.right - CHART.left;

  const dots = points.map((point, index) => {
    const x = CHART.left + (index / lastIndex) * width;
    const y = CHART.bottom - ((point.score - min) / range) * height;
    return { x, y, score: point.score };
  });
  const line = dots.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${CHART.left},${CHART.bottom} ${line} ${CHART.right},${CHART.bottom}`;
  const latest = scores[scores.length - 1] ?? 0;
  const delta = latest - (scores[0] ?? latest);

  return { line, area, dots, min, max, latest, delta };
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const geometry = useMemo(() => buildGeometry(data), [data]);
  const firstLabel = data[0]?.date ? formatDateLabel(data[0].date) : "";
  const lastLabel = data[data.length - 1]?.date
    ? formatDateLabel(data[data.length - 1].date)
    : "";
  const deltaLabel = `${geometry.delta >= 0 ? "+" : ""}${geometry.delta.toFixed(2)}`;
  const latestLabel = geometry.latest.toFixed(2);

  return (
    <div className="w-full h-56 sm:h-64 rounded-xl border border-[var(--card-border)] bg-[var(--bg)]/60 p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>7D sentiment</span>
        <span className="font-medium text-[var(--text-secondary)]">
          Last {latestLabel} · 7D {deltaLabel}
        </span>
      </div>
      <div className="relative h-[calc(100%-2.25rem)] overflow-hidden rounded-lg bg-white/45">
        <svg className="h-full w-full" viewBox="0 0 100 76" preserveAspectRatio="none" role="img">
        <title>7-day sentiment trend</title>
        <defs>
          <linearGradient id="sentimentFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2A2A2A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2A2A2A" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[CHART.top, 22, 36, 50, CHART.bottom].map((y) => (
          <line
            key={y}
            x1={CHART.left}
            x2={CHART.right}
            y1={y}
            y2={y}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={CHART.left}
          x2={CHART.right}
          y1="36"
          y2="36"
          stroke="rgba(42,42,42,0.18)"
          strokeDasharray="3 3"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        />
        <polygon points={geometry.area} fill="url(#sentimentFill)" />
        <polyline
          fill="none"
          stroke="#2A2A2A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={geometry.line}
        />
        {geometry.dots.map(({ x, y, score }) => (
          <circle
            key={`${x}-${y}-${score}`}
            cx={x}
            cy={y}
            r="1.25"
            fill="#2A2A2A"
            stroke="white"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
        <div className="absolute bottom-1 left-3 right-3 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>{firstLabel}</span>
          <span>{lastLabel}</span>
        </div>
      </div>
    </div>
  );
}
