import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetPricesQuery } from "../market/marketApi";
import { assetIconUrl, baseAsset } from "../../components/shell/activityFormat";

const TABS = ["Favorites", "Top Traded", "Gainers", "Losers", "New"] as const;
type Tab = (typeof TABS)[number];

const TOP_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT"];

export default function HomeMarketsStrip() {
  const [tab, setTab] = useState<Tab>("Top Traded");
  const { data: prices } = useGetPricesQuery();

  const rows = TOP_SYMBOLS.map((symbol) => {
    const tick = prices?.[symbol];
    const last = tick?.price != null ? Number(tick.price) : null;
    const change = tick?.change_pct_24h != null ? Number(tick.change_pct_24h) : null;
    const high = tick?.high_24h != null ? Number(tick.high_24h) : null;
    const low = tick?.low_24h != null ? Number(tick.low_24h) : null;
    const volume = tick?.volume_24h != null ? Number(tick.volume_24h) : null;
    return { symbol, last, change, high, low, volume };
  }).sort((a, b) => {
    if (tab === "Gainers") return (b.change ?? -Infinity) - (a.change ?? -Infinity);
    if (tab === "Losers") return (a.change ?? Infinity) - (b.change ?? Infinity);
    return 0;
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
      <div className="flex flex-grow justify-between gap-3 px-4 pt-4">
        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rail-icon rounded-lg px-2 py-1.5 text-xs font-medium ${
                tab === t
                  ? "bg-black/[0.08] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 pb-3 pt-2">
        {tab === "Favorites" ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--text-muted)]">
            Star markets from Trade to pin them here.
          </p>
        ) : tab === "New" ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--text-muted)]">
            New listings will show up here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="text-xs text-[var(--text-muted)]">
                  <th className="px-2 py-2 font-medium">Market</th>
                  <th className="px-2 py-2 text-right font-medium">Price</th>
                  <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                    24H Low
                  </th>
                  <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                    24H High
                  </th>
                  <th className="px-2 py-2 text-right font-medium">24H Chg.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol} className="border-t border-[var(--card-border)]">
                    <td className="px-2 py-2">
                      <Link
                        to="/trading"
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <AssetImg symbol={row.symbol} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {baseAsset(row.symbol)}
                          <span className="text-[var(--text-muted)]">/USD</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-right text-sm font-medium text-[var(--text-primary)]">
                      {fmt(row.last)}
                    </td>
                    <td className="hidden px-2 py-2 text-right text-sm text-[var(--text-muted)] sm:table-cell">
                      {fmt(row.low)}
                    </td>
                    <td className="hidden px-2 py-2 text-right text-sm text-[var(--text-muted)] sm:table-cell">
                      {fmt(row.high)}
                    </td>
                    <td
                      className={`px-2 py-2 text-right text-xs font-medium ${
                        row.change == null
                          ? "text-[var(--text-muted)]"
                          : row.change >= 0
                            ? "text-emerald-600"
                            : "text-rose-500"
                      }`}
                    >
                      {row.change == null
                        ? "—"
                        : `${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function fmt(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function AssetImg({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const asset = baseAsset(symbol);
  if (failed) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg)] text-[10px] font-semibold text-[var(--text-muted)]">
        {asset.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={assetIconUrl(symbol)}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 rounded-full object-scale-down"
      onError={() => setFailed(true)}
    />
  );
}
