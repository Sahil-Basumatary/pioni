import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  useGetMyPnlChartQuery,
  useGetMySummaryQuery,
} from "../features/portfolio/portfolioApi";
import HomeActivity from "../features/home/HomeActivity";
import HomeHoldingsPanel from "../features/home/HomeHoldingsPanel";
import HomeMarketsStrip from "../features/home/HomeMarketsStrip";
import PortfolioInsights from "../features/home/PortfolioInsights";
import TotalValueCard, {
  RANGE_DAYS,
  type ChartRange,
} from "../features/home/TotalValueCard";

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const [range, setRange] = useState<ChartRange>("1M");
  const days = RANGE_DAYS[range];
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useGetMySummaryQuery(undefined, { skip: !isSignedIn });
  const { data: points = [] } = useGetMyPnlChartQuery(
    { days },
    { skip: !isSignedIn },
  );

  const totalValue =
    summary?.total_value != null ? Number(summary.total_value) : isSignedIn ? null : null;
  const cash =
    summary?.portfolio.cash_balance != null
      ? Number(summary.portfolio.cash_balance)
      : null;
  const upnl =
    summary?.total_unrealized_pnl != null
      ? Number(summary.total_unrealized_pnl)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-[1750px] flex-col gap-2">
      <div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="flex flex-col gap-2 lg:col-span-8">
          <TotalValueCard
            totalValue={totalValue}
            points={points}
            range={range}
            onRangeChange={setRange}
            loading={isSignedIn && summaryLoading}
          />
          <PortfolioInsights
            totalValue={totalValue}
            cashBalance={cash}
            unrealizedPnl={upnl}
          />
          <HomeHoldingsPanel />
          <HomeMarketsStrip />
        </div>
        <div className="flex flex-col lg:col-span-4">
          <HomeActivity />
        </div>
      </div>
    </div>
  );
}
