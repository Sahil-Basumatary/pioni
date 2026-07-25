import { useAuth } from "@clerk/clerk-react";
import { useGetMyTradesQuery } from "../portfolio/portfolioApi";
import ActiveSessionsPanel from "./ActiveSessionsPanel";
import { useSettings } from "./settingsContext";

function formatTradeWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ActivitySection() {
  const { isSignedIn } = useAuth();
  const { setSection } = useSettings();
  const { data: trades = [], isLoading, isError } = useGetMyTradesQuery(
    { limit: 20 },
    { skip: !isSignedIn },
  );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <ActiveSessionsPanel />
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          Recent paper trades
        </h3>
        <p className="mt-1 text-sm text-[#787774]">
          Manage your recent paper trading fills
        </p>
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[1.1fr_0.7fr_0.9fr_0.9fr_1.2fr] gap-2 border-b border-[rgba(42,28,0,0.07)] pb-2 text-xs font-medium text-[#A19E99]">
            <span>Symbol</span>
            <span>Side</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Time</span>
          </div>
          {!isSignedIn ? (
            <p className="py-3 text-sm text-[#787774]">
              Sign in to view recent paper trades.
            </p>
          ) : isLoading ? (
            <p className="py-3 text-sm text-[#787774]">Loading trades…</p>
          ) : isError ? (
            <p className="py-3 text-sm text-[#787774]">
              Couldn’t load recent paper trades.
            </p>
          ) : trades.length === 0 ? (
            <div className="py-3">
              <p className="text-sm text-[#787774]">
                No paper trades yet. Place a fill on Trade to see it here.
              </p>
              <button
                type="button"
                onClick={() => setSection("paper")}
                className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
              >
                Open Paper trading
              </button>
            </div>
          ) : (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="grid min-w-[520px] grid-cols-[1.1fr_0.7fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b border-[rgba(42,28,0,0.05)] py-2.5 text-sm text-[#2C2C2B]"
              >
                <span className="font-medium">{trade.symbol}</span>
                <span
                  className={
                    trade.side === "BUY" ? "text-[#1A7F37]" : "text-[#E56458]"
                  }
                >
                  {trade.side}
                </span>
                <span className="text-[#787774]">{trade.quantity}</span>
                <span className="text-[#787774]">{trade.price}</span>
                <span className="text-[#787774]">
                  {formatTradeWhen(trade.executed_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
