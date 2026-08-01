import { useMemo } from "react";
import { useGetOrderBookQuery } from "../orders/ordersApi";
import { useLanguage } from "../auth/LanguageProvider";

type Point = { x: number; y: number };

function cumulative(levels: { price: string; total_quantity: string }[], asc: boolean) {
  const sorted = [...levels].sort((a, b) =>
    asc ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price),
  );
  let sum = 0;
  return sorted.map((level) => {
    sum += Number(level.total_quantity);
    return { price: Number(level.price), cum: sum };
  });
}

function toPath(points: Point[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

export default function DepthChartPanel({ symbol }: { symbol: string }) {
  const { t } = useLanguage();
  const { data } = useGetOrderBookQuery({ symbol, depth: 40 }, {
    pollingInterval: 3_000,
  });

  const { bidPath, askPath, midY, pctLabel } = useMemo(() => {
    const w = 600;
    const h = 320;
    const bids = cumulative(data?.bids ?? [], false);
    const asks = cumulative(data?.asks ?? [], true);
    const maxCum = Math.max(
      bids[bids.length - 1]?.cum ?? 0,
      asks[asks.length - 1]?.cum ?? 0,
      1,
    );
    const prices = [...bids, ...asks].map((p) => p.price);
    const minP = Math.min(...prices, 0);
    const maxP = Math.max(...prices, 1);
    const span = Math.max(maxP - minP, 1e-9);
    const mapX = (price: number) => ((price - minP) / span) * w;
    const mapY = (cum: number) => h - (cum / maxCum) * (h - 24) - 8;
    const bidPts: Point[] = bids.map((b) => ({ x: mapX(b.price), y: mapY(b.cum) }));
    const askPts: Point[] = asks.map((a) => ({ x: mapX(a.price), y: mapY(a.cum) }));
    if (bidPts.length) {
      bidPts.unshift({ x: bidPts[0].x, y: h });
      bidPts.push({ x: bidPts[bidPts.length - 1].x, y: h });
    }
    if (askPts.length) {
      askPts.unshift({ x: askPts[0].x, y: h });
      askPts.push({ x: askPts[askPts.length - 1].x, y: h });
    }
    const mid =
      bids[0] && asks[0] ? (bids[0].price + asks[0].price) / 2 : null;
    return {
      bidPath: toPath(bidPts),
      askPath: toPath(askPts),
      midY: mid != null ? mapX(mid) : w / 2,
      pctLabel: "100.000%",
    };
  }, [data]);

  return (
    <div className="flex h-full min-h-0 flex-col px-2 pt-2">
      <div className="mb-2 flex min-h-7 flex-row-reverse items-center gap-3 mx-2">
        <span className="text-xs text-[rgb(104,107,130)]">{pctLabel}</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg
          viewBox="0 0 600 320"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-label={t("tradePaneDepthChart")}
        >
          <line
            x1={midY}
            y1={0}
            x2={midY}
            y2={320}
            stroke="rgba(104,107,130,0.24)"
            strokeWidth="1"
          />
          {bidPath ? (
            <path d={bidPath} fill="rgba(35,186,117,0.28)" stroke="rgb(35,186,117)" strokeWidth="1.5" />
          ) : null}
          {askPath ? (
            <path d={askPath} fill="rgba(232,80,91,0.28)" stroke="rgb(232,80,91)" strokeWidth="1.5" />
          ) : null}
        </svg>
      </div>
    </div>
  );
}
