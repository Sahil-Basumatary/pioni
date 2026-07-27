import { useState } from "react";
import { useParams } from "react-router-dom";
import AnalyticsHeader from "../features/analytics/AnalyticsHeader";
import AnalyticsWidgetCard from "../features/analytics/AnalyticsWidgetCard";
import AnalyticsKlineWidget from "../features/analytics/AnalyticsKlineWidget";
import AnalyticsOrderBookWidget from "../features/analytics/AnalyticsOrderBookWidget";
import {
  ANALYTICS_WIDGETS,
  analyticsPathToSymbol,
  type AnalyticsInterval,
  type AnalyticsWidgetId,
} from "../features/analytics/analyticsConfig";

export default function AnalyticsPage() {
  const { pair } = useParams<{ pair?: string }>();
  const symbol = analyticsPathToSymbol(pair);
  const [intervals, setIntervals] = useState<Record<string, AnalyticsInterval>>(
    () =>
      Object.fromEntries(
        ANALYTICS_WIDGETS.map((w) => [w.id, "1h" as AnalyticsInterval]),
      ),
  );

  return (
    <div className="mx-auto flex w-full max-w-[1750px] flex-col gap-2 px-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-2 pt-1">
        <div className="min-w-0 shrink-0">
          <h1 className="text-base font-medium leading-5 text-[var(--text-primary)]">
            Market analytics
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-[rgb(104,107,130)]">
            Choose a pair to view charts and market stats
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <AnalyticsHeader symbol={symbol} />
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {ANALYTICS_WIDGETS.map((widget) => {
          const interval = intervals[widget.id] ?? "1h";
          return (
            <AnalyticsWidgetCard
              key={widget.id}
              title={widget.title}
              interval={interval}
              showInterval={widget.id !== "orderbook"}
              onIntervalChange={(next) =>
                setIntervals((prev) => ({ ...prev, [widget.id]: next }))
              }
            >
              {renderWidget(widget.id, symbol, interval)}
            </AnalyticsWidgetCard>
          );
        })}
      </div>
    </div>
  );
}

function renderWidget(
  id: AnalyticsWidgetId,
  symbol: string,
  interval: AnalyticsInterval,
) {
  if (id === "orderbook") {
    return <AnalyticsOrderBookWidget symbol={symbol} />;
  }
  return (
    <AnalyticsKlineWidget id={id} symbol={symbol} interval={interval} />
  );
}
