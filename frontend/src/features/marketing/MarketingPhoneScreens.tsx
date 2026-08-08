const EQUITY =
  "M0 46 L14 42 L28 44 L42 34 L56 37 L70 26 L84 30 L98 18 L112 22 L126 12 L140 15 L154 6";

const CANDLES = [
  [30, 44, 26, 41],
  [41, 46, 34, 36],
  [36, 40, 28, 38],
  [38, 52, 36, 50],
  [50, 56, 44, 46],
  [46, 50, 33, 35],
  [35, 45, 32, 44],
  [44, 60, 42, 57],
  [57, 64, 52, 54],
  [54, 58, 41, 45],
] as const;

function Sparkline({ up = true }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 60 18" className="h-4 w-14" fill="none" aria-hidden>
      <path
        d={
          up
            ? "M0 14 L12 11 L22 13 L34 6 L46 8 L60 2"
            : "M0 4 L12 7 L22 5 L34 12 L46 9 L60 15"
        }
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={up ? "text-emerald-600" : "text-rose-500"}
      />
    </svg>
  );
}

function TabBar({ active }: { active: string }) {
  return (
    <div className="marketing-phone__tabs">
      {["Markets", "Trade", "Portfolio", "Activity"].map((tab) => (
        <span
          key={tab}
          className={
            tab === active
              ? "font-semibold text-[var(--text-primary)]"
              : "text-[var(--text-muted)]"
          }
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

export function TradeScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pt-1.5">
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">
          BTC/USD
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">Spot</span>
      </div>
      <div className="px-3 pt-1">
        <div className="text-[17px] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
          63,093.00
        </div>
        <div className="text-[9px] font-medium tabular-nums text-rose-600">
          −1,217.40 (−1.89%)
        </div>
      </div>
      <svg viewBox="0 0 160 70" className="mt-1 h-24 w-full px-2" aria-hidden>
        {CANDLES.map((c, i) => {
          const [open, high, low, close] = c;
          const x = 10 + i * 15;
          const up = close >= open;
          return (
            <g key={x} className={up ? "text-emerald-600" : "text-rose-500"}>
              <line
                x1={x}
                x2={x}
                y1={70 - high}
                y2={70 - low}
                stroke="currentColor"
                strokeWidth="1"
              />
              <rect
                x={x - 3.5}
                y={70 - Math.max(open, close)}
                width="7"
                height={Math.max(Math.abs(close - open), 1.5)}
                fill="currentColor"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 px-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/[0.05] p-[3px]">
          <span className="rounded-md bg-white py-1 text-center text-[9px] font-semibold text-[var(--text-primary)]">
            Buy
          </span>
          <span className="py-1 text-center text-[9px] text-[var(--text-muted)]">
            Sell
          </span>
        </div>
        <div className="mt-1.5 rounded-lg border border-[var(--card-border)] px-2 py-1">
          <div className="text-[7px] text-[var(--text-muted)]">Limit price USD</div>
          <div className="text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">
            63,098.00
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-[8px]">
          <span className="text-[var(--text-muted)]">Available</span>
          <span className="tabular-nums text-[var(--text-primary)]">10,000 USD</span>
        </div>
        <div className="mt-1.5 rounded-lg bg-[var(--text-primary)] py-1.5 text-center text-[10px] font-semibold text-white">
          Buy BTC/USD
        </div>
        <div className="mt-2 space-y-1 border-t border-[var(--card-border)] pt-1.5">
          <div className="text-[7px] uppercase tracking-wide text-[var(--text-muted)]">
            Recent trades
          </div>
          {[
            ["63,093.0", "0.0396", true],
            ["63,070.7", "0.1188", false],
            ["63,102.3", "0.0231", true],
          ].map(([price, qty, up]) => (
            <div key={price as string} className="flex justify-between text-[8px]">
              <span
                className={`tabular-nums ${up ? "text-emerald-700" : "text-rose-600"}`}
              >
                {price}
              </span>
              <span className="tabular-nums text-[var(--text-muted)]">{qty}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <TabBar active="Trade" />
      </div>
    </div>
  );
}

export function PortfolioScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-2">
        <div className="text-[8px] text-[var(--text-muted)]">Portfolio value</div>
        <div className="text-[17px] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
          10,000.00 <span className="text-[10px] font-medium">USD</span>
        </div>
        <div className="text-[8px] text-[var(--text-muted)]">Available 10,000 USD</div>
      </div>
      <svg viewBox="0 0 154 52" className="mt-2 h-14 w-full px-2" fill="none" aria-hidden>
        <defs>
          <linearGradient id="mkt-phone-eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101114" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#101114" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${EQUITY} L154 52 L0 52 Z`} fill="url(#mkt-phone-eq)" />
        <path
          d={EQUITY}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          className="text-[var(--text-primary)]"
        />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1.5 px-3">
        {["Deposit", "Convert", "Transfer"].map((action) => (
          <span
            key={action}
            className="rounded-lg border border-[var(--card-border)] py-1 text-center text-[8px] font-medium text-[var(--text-primary)]"
          >
            {action}
          </span>
        ))}
      </div>
      <div className="mt-2 space-y-1.5 px-3">
        {[
          ["USD", "10,000.00"],
          ["BTC", "0.15000000"],
          ["ETH", "2.40000000"],
          ["SOL", "18.0000000"],
          ["XRP", "500.000000"],
        ].map(([asset, amount]) => (
          <div key={asset} className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-[var(--text-primary)]">
              {asset}
            </span>
            <span className="text-[9px] tabular-nums text-[var(--text-muted)]">
              {amount}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <TabBar active="Portfolio" />
      </div>
    </div>
  );
}

export function MarketsScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-2">
        <div className="rounded-lg bg-black/[0.05] px-2 py-1 text-[8px] text-[var(--text-muted)]">
          Search for a market
        </div>
        <div className="mt-2 flex gap-3 text-[9px]">
          <span className="font-semibold text-[var(--text-primary)]">Spot</span>
          <span className="text-[var(--text-muted)]">Margin</span>
          <span className="text-[var(--text-muted)]">Favorites</span>
        </div>
      </div>
      <div className="mt-2 space-y-2 px-3">
        {[
          ["Bitcoin", "63,093.00", true],
          ["Ether", "1,873.50", true],
          ["Solana", "72.97", false],
          ["XRP", "1.07", true],
          ["Cardano", "0.1803", true],
          ["Polkadot", "0.7950", false],
        ].map(([name, price, up]) => (
          <div key={name as string} className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-[var(--text-primary)]">
              {name}
            </span>
            <Sparkline up={up as boolean} />
            <span className="text-[9px] tabular-nums text-[var(--text-primary)]">
              {price}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <TabBar active="Markets" />
      </div>
    </div>
  );
}

export function TicketScreen() {
  return (
    <div className="flex h-full flex-col px-3 pt-2">
      <div className="text-[10px] font-semibold text-[var(--text-primary)]">
        Review order
      </div>
      <div className="mt-2 space-y-1.5 rounded-lg border border-[var(--card-border)] p-2">
        {[
          ["Side", "Buy"],
          ["Type", "Limit"],
          ["Price", "63,098.00"],
          ["Quantity", "0.1500 BTC"],
          ["Total", "9,464.70 USD"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-[8px]">
            <span className="text-[var(--text-muted)]">{label}</span>
            <span className="tabular-nums text-[var(--text-primary)]">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg bg-black/[0.04] p-2 text-[7px] leading-relaxed text-[var(--text-muted)]">
        Simulated funds. This order settles against your practice balance.
      </div>
      <div className="mt-2 rounded-full bg-[var(--text-primary)] py-1.5 text-center text-[9px] font-semibold text-white">
        Swipe to confirm
      </div>
      <div className="mt-3 space-y-1.5 border-t border-[var(--card-border)] pt-2">
        <div className="text-[7px] uppercase tracking-wide text-[var(--text-muted)]">
          Recent orders
        </div>
        {[
          ["Buy BTC/USD", "Filled"],
          ["Sell ETH/USD", "Filled"],
          ["Buy SOL/USD", "Open"],
        ].map(([pair, state]) => (
          <div key={pair} className="flex justify-between text-[8px]">
            <span className="text-[var(--text-primary)]">{pair}</span>
            <span className="text-[var(--text-muted)]">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityScreen() {
  return (
    <div className="flex h-full flex-col px-3 pt-2">
      <div className="flex gap-3 text-[9px]">
        <span className="font-semibold text-[var(--text-primary)]">Orders</span>
        <span className="text-[var(--text-muted)]">Fills</span>
      </div>
      <div className="mt-2 space-y-2">
        {[
          ["Buy BTC/USD", "Filled", "0.1500"],
          ["Sell ETH/USD", "Filled", "1.2000"],
          ["Buy SOL/USD", "Open", "18.000"],
          ["Buy XRP/USD", "Filled", "500.00"],
          ["Sell BTC/USD", "Filled", "0.0800"],
          ["Buy ADA/USD", "Filled", "1,200.0"],
          ["Buy DOT/USD", "Cancelled", "240.00"],
        ].map(([pair, state, qty]) => (
          <div key={pair} className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-medium text-[var(--text-primary)]">
                {pair}
              </div>
              <div className="text-[7px] text-[var(--text-muted)]">{state}</div>
            </div>
            <span className="text-[9px] tabular-nums text-[var(--text-muted)]">
              {qty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
