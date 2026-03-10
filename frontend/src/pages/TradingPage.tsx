export default function TradingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Trading</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Live market data and candlestick charts.
        </p>
      </div>
      <div className="card-premium rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Charts and live data coming next.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Work in progress
          </div>
        </div>
      </div>
    </div>
  );
}
