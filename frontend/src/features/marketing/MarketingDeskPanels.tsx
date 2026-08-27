const ASKS = [
  { price: "63,228.5", qty: "0.0396", depth: 0.32 },
  { price: "63,197.0", qty: "0.1188", depth: 0.58 },
  { price: "63,165.4", qty: "0.0792", depth: 0.44 },
  { price: "63,142.1", qty: "0.0231", depth: 0.21 },
] as const;

const BIDS = [
  { price: "63,070.7", qty: "0.0396", depth: 0.28 },
  { price: "63,039.2", qty: "0.0792", depth: 0.47 },
  { price: "63,007.6", qty: "0.1188", depth: 0.66 },
  { price: "62,976.1", qty: "0.0584", depth: 0.38 },
] as const;

const CANDLES = [
  [42, 58, 38, 54],
  [54, 62, 50, 51],
  [51, 55, 40, 44],
  [44, 49, 33, 47],
  [47, 66, 45, 63],
  [63, 71, 58, 60],
  [60, 64, 46, 49],
  [49, 57, 44, 56],
  [56, 74, 54, 71],
  [71, 78, 66, 68],
  [68, 72, 55, 58],
  [58, 69, 56, 67],
] as const;

const CANDLE_X = (i: number) => 24 + i * 43;
const CANDLE_Y = (v: number) => 88 - (v - 33) * 1.78;

const LINE = CANDLES.map(
  (c, i) => `${i === 0 ? "M" : "L"}${CANDLE_X(i)} ${CANDLE_Y(c[3]).toFixed(1)}`,
).join(" ");

function PanelFrame({
  title,
  tabs,
  children,
}: {
  title: string;
  tabs?: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-panel">
      <div className="marketing-panel__bar">
        <span className="marketing-panel__title">{title}</span>
        {tabs?.map((tab) => (
          <span key={tab} className="marketing-panel__tab">
            {tab}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

export function OrderTicketPanel() {
  return (
    <PanelFrame title="Order form" tabs={["Alerts"]}>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/[0.05] p-1">
          <span className="rounded-md bg-white py-1.5 text-center text-[11px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)]">
            Buy
          </span>
          <span className="py-1.5 text-center text-[11px] font-medium text-[var(--text-muted)]">
            Sell
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px]">
          <span className="font-semibold text-[var(--text-primary)]">Limit</span>
          <span className="text-[var(--text-muted)]">Market</span>
          <span className="text-[var(--text-muted)]">Advanced</span>
        </div>
        <div className="mt-2.5 rounded-lg border border-[var(--text-primary)] px-2.5 py-1.5">
          <div className="text-[9px] text-[var(--text-muted)]">Limit price USD</div>
          <div className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
            63,098.0
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            ["Quantity BTC", "0.1500"],
            ["Total USD", "9,464.70"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[var(--card-border)] px-2.5 py-1.5"
            >
              <div className="text-[9px] text-[var(--text-muted)]">{label}</div>
              <div className="text-[11px] font-medium tabular-nums text-[var(--text-primary)]">
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-black/[0.08]">
            <span className="block h-full w-1/2 rounded-full bg-[var(--text-primary)]" />
          </span>
          <span className="text-[9px] tabular-nums text-[var(--text-muted)]">50%</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-muted)]">Available to trade</span>
          <span className="font-medium tabular-nums text-[var(--text-primary)]">
            10,000.00 USD
          </span>
        </div>
        <div className="mt-3 rounded-lg bg-[var(--text-primary)] py-2 text-center text-[11px] font-semibold text-white">
          Buy BTC/USD
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
          {["TP/SL", "Post only", "Reduce only"].map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] border border-[var(--card-border)]" />
              {label}
            </span>
          ))}
        </div>
        <div className="mt-3 space-y-2 border-t border-[var(--card-border)] pt-3 text-[10px]">
          {[
            ["Time in force", "Good till cancelled"],
            ["Estimated fee", "0.00 USD"],
            ["Order value", "9,464.70 USD"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">{label}</span>
              <span className="tabular-nums text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </PanelFrame>
  );
}

export function OrderBookPanel() {
  return (
    <PanelFrame title="Order book" tabs={["Trades"]}>
      <div className="px-3 pb-3 pt-2">
        <div className="flex justify-between text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
          <span>Price</span>
          <span>Quantity</span>
        </div>
        <div className="mt-1.5 space-y-[3px]">
          {ASKS.map((row) => (
            <div key={row.price} className="marketing-book__row">
              <span
                className="marketing-book__depth marketing-book__depth--ask"
                style={{ width: `${row.depth * 100}%` }}
              />
              <span className="relative tabular-nums text-rose-600">{row.price}</span>
              <span className="relative tabular-nums text-[var(--text-muted)]">
                {row.qty}
              </span>
            </div>
          ))}
        </div>
        <div className="my-2 flex items-center justify-between border-y border-[var(--card-border)] py-1.5 text-[10px]">
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
            63,093.0
          </span>
          <span className="text-[var(--text-muted)]">Spread 63.1</span>
        </div>
        <div className="space-y-[3px]">
          {BIDS.map((row) => (
            <div key={row.price} className="marketing-book__row">
              <span
                className="marketing-book__depth marketing-book__depth--bid"
                style={{ width: `${row.depth * 100}%` }}
              />
              <span className="relative tabular-nums text-emerald-700">{row.price}</span>
              <span className="relative tabular-nums text-[var(--text-muted)]">
                {row.qty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PanelFrame>
  );
}

export function ChartPanel() {
  return (
    <PanelFrame title="Market chart" tabs={["1m", "15m", "1h", "1D"]}>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            63,093.00
          </span>
          <span className="text-[11px] font-medium tabular-nums text-rose-600">
            −1.89%
          </span>
        </div>
        <svg
          viewBox="0 0 520 104"
          preserveAspectRatio="none"
          className="mt-2 min-h-[7rem] w-full flex-1"
          aria-hidden
        >
          {[24, 48, 72].map((y) => (
            <line
              key={y}
              x1="0"
              x2="520"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="text-black/[0.06]"
            />
          ))}
          {CANDLES.map((c, i) => {
            const [open, high, low, close] = c;
            const x = CANDLE_X(i);
            const up = close >= open;
            return (
              <g key={x} className={up ? "text-emerald-600" : "text-rose-500"}>
                <line
                  x1={x}
                  x2={x}
                  y1={CANDLE_Y(high)}
                  y2={CANDLE_Y(low)}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x={x - 7}
                  y={CANDLE_Y(Math.max(open, close))}
                  width="14"
                  height={Math.max(Math.abs(close - open) * 1.78, 2)}
                  fill="currentColor"
                  opacity={up ? 0.85 : 0.75}
                />
              </g>
            );
          })}
          <path
            d={LINE}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="text-[var(--text-primary)]"
          />
        </svg>
      </div>
    </PanelFrame>
  );
}

export function PositionsPanel() {
  return (
    <PanelFrame title="Balances" tabs={["Positions", "Orders", "Trades"]}>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
          <span>Asset</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Value</span>
        </div>
        <div className="mt-1.5 divide-y divide-[var(--card-border)]">
          {[
            ["USD", "10,000.00", "10,000.00"],
            ["BTC", "0.15000000", "9,464.70"],
            ["ETH", "2.40000000", "4,496.40"],
            ["SOL", "18.0000000", "1,313.46"],
          ].map(([asset, balance, value]) => (
            <div
              key={asset}
              className="grid grid-cols-[1.4fr_1fr_1fr] py-[7px] text-[10px] tabular-nums"
            >
              <span className="font-medium text-[var(--text-primary)]">{asset}</span>
              <span className="text-right text-[var(--text-muted)]">{balance}</span>
              <span className="text-right text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[var(--card-border)] pt-2 text-[10px]">
          <span className="font-medium text-[var(--text-primary)]">Total value</span>
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
            25,274.56 USD
          </span>
        </div>
      </div>
    </PanelFrame>
  );
}
