import { useRef, useState } from "react";
import CandlestickChart, {
  type CandlestickChartHandle,
} from "../components/trading/CandlestickChart";

const DEFAULT_SYMBOL = "BTCUSDT";

export default function TradingPage() {
  const [symbol] = useState(DEFAULT_SYMBOL);
  const chartRef = useRef<CandlestickChartHandle>(null);
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7.5rem)]">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {symbol}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Live market data and candlestick charts.
        </p>
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-4">
        <CandlestickChart ref={chartRef} symbol={symbol} />
      </div>
    </div>
  );
}
