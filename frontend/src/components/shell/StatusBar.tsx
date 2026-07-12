import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectMarketStatus } from "../../features/market/marketSlice";
import { useLiveMarketTrade } from "../../features/market/liveMarketStore";
import { useGetPricesQuery } from "../../features/market/marketApi";
import { formatUsd } from "../../utils/formatters";
import type { ConnectionStatus } from "../../hooks/useMarketWebSocket";

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-400 animate-pulse",
  disconnected: "bg-red-500",
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Online",
  connecting: "Connecting",
  disconnected: "Offline",
};

const TICKERS = [
  { symbol: "BTCUSDT", label: "BTC/USD" },
  { symbol: "ETHUSDT", label: "ETH/USD" },
] as const;

export default function StatusBar() {
  const status = useAppSelector(selectMarketStatus);
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });

  return (
    <footer className="sticky bottom-0 z-40 border-t border-[var(--card-border)] bg-[var(--card-bg)]">
      <div className="mx-auto flex h-9 max-w-[1320px] items-center gap-3 px-4 text-xs text-[var(--text-muted)] lg:px-12">
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
            aria-hidden="true"
          />
          <span className="font-medium text-[var(--text-primary)]">
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="hidden h-3 w-px bg-[var(--card-border)] sm:block" />
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          {TICKERS.map((ticker) => (
            <TickerChip
              key={ticker.symbol}
              symbol={ticker.symbol}
              label={ticker.label}
              changePct={prices?.[ticker.symbol]?.change_pct_24h ?? null}
            />
          ))}
          <span className="hidden truncate text-[11px] md:inline">
            Paper trading only — simulated funds, not real money.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <a
            href="mailto:sahil@sahilbasumatary.dev?subject=Pioni%20feedback"
            className="hidden transition-colors hover:text-[var(--text-primary)] sm:inline"
          >
            Share feedback
          </a>
          <a
            href="mailto:sahil@sahilbasumatary.dev?subject=Pioni%20support"
            className="hidden transition-colors hover:text-[var(--text-primary)] md:inline"
          >
            Chat with us
          </a>
          <NavLink
            to="/privacy"
            className="transition-colors hover:text-[var(--text-primary)]"
          >
            Privacy
          </NavLink>
          <NavLink
            to="/terms"
            className="transition-colors hover:text-[var(--text-primary)]"
          >
            Terms
          </NavLink>
        </div>
      </div>
    </footer>
  );
}

function TickerChip({
  symbol,
  label,
  changePct,
}: {
  symbol: string;
  label: string;
  changePct: number | null;
}) {
  const trade = useLiveMarketTrade(symbol);
  const price = trade ? formatUsd(trade.price) : "—";
  const pctClass =
    changePct == null
      ? "text-[var(--text-muted)]"
      : changePct >= 0
        ? "text-emerald-600"
        : "text-red-500";
  const pctLabel =
    changePct == null
      ? ""
      : ` ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;

  return (
    <span className="shrink-0 tabular-nums">
      <span className="font-medium text-[var(--text-primary)]">{label}</span>{" "}
      <span className="text-[var(--text-primary)]">{price}</span>
      {pctLabel && <span className={pctClass}>{pctLabel}</span>}
    </span>
  );
}
