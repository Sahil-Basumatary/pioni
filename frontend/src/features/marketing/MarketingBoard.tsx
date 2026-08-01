import { Link } from "react-router-dom";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";
import { useGetPricesQuery } from "../market/marketApi";
import { MARKET_CATALOG } from "../markets/catalog";
import { formatChangePct, formatMarketPrice } from "../markets/format";

const BOARD_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "DOGEUSDT",
] as const;

export default function MarketingBoard() {
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });

  const cards = BOARD_SYMBOLS.map((symbol) => {
    const meta = MARKET_CATALOG.find((m) => m.symbol === symbol);
    const tick = prices?.[symbol];
    const price = tick?.price != null ? Number(tick.price) : null;
    const changePct =
      tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null;
    return {
      symbol,
      label: meta?.label ?? baseAsset(symbol),
      name: meta?.name ?? baseAsset(symbol),
      price,
      changePct,
    };
  });

  return (
    <section
      data-mkt="board"
      className="mx-auto mt-12 w-full max-w-5xl px-4 pb-16 sm:mt-16"
      aria-label="Markets now"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Markets now
        </h2>
        <Link
          to="/markets"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          View markets
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const up = card.changePct != null && card.changePct >= 0;
          const tone =
            card.changePct == null
              ? "text-[var(--text-muted)]"
              : up
                ? "text-emerald-600"
                : "text-rose-500";
          return (
            <Link
              key={card.symbol}
              to="/trading"
              data-mkt="card"
              className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-card)] transition hover:bg-black/[0.02]"
            >
              <img
                src={assetIconUrl(card.symbol)}
                alt=""
                className="h-9 w-9 rounded-full bg-[var(--bg)] object-scale-down"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {card.label}
                  </span>
                  <span className="truncate text-xs text-[var(--text-muted)]">
                    {card.name}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                    {formatMarketPrice(card.price)}
                    <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                      USD
                    </span>
                  </span>
                  <span className={`text-xs font-medium tabular-nums ${tone}`}>
                    {formatChangePct(card.changePct)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
