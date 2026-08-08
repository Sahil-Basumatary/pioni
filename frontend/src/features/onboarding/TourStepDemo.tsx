import type { ReactNode } from "react";

type DemoProps = { className?: string };

function Frame({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <title>{label}</title>
      <rect width="320" height="160" rx="12" fill="#F5F5F5" />
      <rect x="10" y="10" width="300" height="140" rx="10" fill="#FFFFFF" stroke="#E8E8E8" />
      {children}
    </svg>
  );
}

function ChartDemo({ className }: DemoProps) {
  return (
    <Frame className={className} label="Chart demo">
      <g className="pioni-demo-chart">
        <path d="M36 118H284" stroke="#E5E5E5" />
        <path d="M36 88H284" stroke="#F0F0F0" />
        <path d="M36 58H284" stroke="#F0F0F0" />
        <g className="pioni-demo-candles">
          <rect className="pioni-demo-c" x="52" y="78" width="10" height="28" rx="2" fill="#C8C8C8" />
          <rect className="pioni-demo-c" x="78" y="64" width="10" height="42" rx="2" fill="#9A9A9A" />
          <rect className="pioni-demo-c" x="104" y="52" width="10" height="54" rx="2" fill="#2A2A2A" />
          <rect className="pioni-demo-c" x="130" y="60" width="10" height="46" rx="2" fill="#6A6A6A" />
          <rect className="pioni-demo-c" x="156" y="44" width="10" height="62" rx="2" fill="#0A0A0A" />
          <rect className="pioni-demo-c" x="182" y="56" width="10" height="50" rx="2" fill="#4A4A4A" />
          <rect className="pioni-demo-c" x="208" y="38" width="10" height="68" rx="2" fill="#2A2A2A" />
          <rect className="pioni-demo-c" x="234" y="48" width="10" height="58" rx="2" fill="#8A8A8A" />
        </g>
        <path
          className="pioni-demo-draw"
          d="M52 96C78 90 100 72 130 68C160 64 178 70 208 50C230 38 250 44 270 40"
          stroke="#0A0A0A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g className="pioni-demo-cursor">
          <circle cx="208" cy="50" r="4" fill="#0A0A0A" />
          <rect x="196" y="24" width="56" height="16" rx="4" fill="#2A2A2A" />
          <text x="204" y="35" fill="#FFFFFF" fontSize="8" fontFamily="'Archivo Variable', system-ui, sans-serif">
            BTC/USD
          </text>
        </g>
      </g>
    </Frame>
  );
}

function BalanceDemo({ className }: DemoProps) {
  return (
    <Frame className={className} label="Balance demo">
      <g className="pioni-demo-balance">
        <rect x="40" y="48" width="160" height="64" rx="12" fill="#F7F7F7" stroke="#E8E8E8" />
        <text x="56" y="72" fill="#8A8A8A" fontSize="10" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Available
        </text>
        <text
          className="pioni-demo-balance-num"
          x="56"
          y="96"
          fill="#0A0A0A"
          fontSize="20"
          fontWeight="600"
          fontFamily="'Archivo Variable', system-ui, sans-serif"
        >
          $100,000
        </text>
        <g className="pioni-demo-coin">
          <circle cx="248" cy="80" r="28" fill="#2A2A2A" />
          <text x="239" y="86" fill="#FFFFFF" fontSize="18" fontWeight="700" fontFamily="'Archivo Variable', system-ui, sans-serif">
            $
          </text>
        </g>
        <path
          className="pioni-demo-check"
          d="M236 80L246 90L264 70"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0"
        />
      </g>
    </Frame>
  );
}

function OrderDemo({ className }: DemoProps) {
  return (
    <Frame className={className} label="Order ticket demo">
      <g className="pioni-demo-order">
        <rect x="36" y="28" width="120" height="28" rx="8" fill="#0A0A0A" />
        <text x="72" y="46" fill="#FFFFFF" fontSize="11" fontWeight="600" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Buy
        </text>
        <rect x="164" y="28" width="120" height="28" rx="8" fill="#F0F0F0" />
        <text x="206" y="46" fill="#8A8A8A" fontSize="11" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Sell
        </text>
        <rect x="36" y="70" width="248" height="36" rx="8" fill="#F7F7F7" stroke="#E5E5E5" />
        <text x="48" y="92" fill="#8A8A8A" fontSize="10" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Quantity
        </text>
        <text
          className="pioni-demo-qty"
          x="200"
          y="92"
          fill="#0A0A0A"
          fontSize="12"
          fontWeight="600"
          fontFamily="'Archivo Variable', system-ui, sans-serif"
        >
          0.001
        </text>
        <rect className="pioni-demo-submit" x="36" y="118" width="248" height="22" rx="8" fill="#2A2A2A" />
        <text x="118" y="133" fill="#FFFFFF" fontSize="10" fontWeight="600" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Place order
        </text>
        <g className="pioni-demo-click">
          <circle cx="250" cy="129" r="8" fill="#FFFFFF" fillOpacity="0.35" />
        </g>
      </g>
    </Frame>
  );
}

function PositionsDemo({ className }: DemoProps) {
  return (
    <Frame className={className} label="Positions demo">
      <g className="pioni-demo-positions">
        <text x="36" y="40" fill="#8A8A8A" fontSize="9" fontFamily="'Archivo Variable', system-ui, sans-serif">
          SYMBOL
        </text>
        <text x="140" y="40" fill="#8A8A8A" fontSize="9" fontFamily="'Archivo Variable', system-ui, sans-serif">
          SIZE
        </text>
        <text x="220" y="40" fill="#8A8A8A" fontSize="9" fontFamily="'Archivo Variable', system-ui, sans-serif">
          P&amp;L
        </text>
        <g className="pioni-demo-row">
          <rect x="28" y="52" width="264" height="36" rx="8" fill="#F7F7F7" />
          <text x="40" y="74" fill="#0A0A0A" fontSize="12" fontWeight="600" fontFamily="'Archivo Variable', system-ui, sans-serif">
            BTC
          </text>
          <text x="140" y="74" fill="#0A0A0A" fontSize="12" fontFamily="'Archivo Variable', system-ui, sans-serif">
            0.001
          </text>
          <text
            className="pioni-demo-pnl"
            x="220"
            y="74"
            fill="#149E61"
            fontSize="12"
            fontWeight="600"
            fontFamily="'Archivo Variable', system-ui, sans-serif"
          >
            +$12.40
          </text>
        </g>
        <path
          className="pioni-demo-pnl-line"
          d="M40 120C80 118 110 108 150 100C190 92 230 96 280 86"
          stroke="#149E61"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </Frame>
  );
}

function SentimentDemo({ className }: DemoProps) {
  return (
    <Frame className={className} label="Sentiment demo">
      <g className="pioni-demo-sentiment">
        <rect x="36" y="36" width="100" height="88" rx="12" fill="#F7F7F7" stroke="#E8E8E8" />
        <text x="56" y="58" fill="#8A8A8A" fontSize="9" fontFamily="'Archivo Variable', system-ui, sans-serif">
          Sentiment
        </text>
        <text
          className="pioni-demo-score"
          x="52"
          y="92"
          fill="#0A0A0A"
          fontSize="28"
          fontWeight="700"
          fontFamily="'Archivo Variable', system-ui, sans-serif"
        >
          72
        </text>
        <text x="98" y="92" fill="#8A8A8A" fontSize="12" fontFamily="'Archivo Variable', system-ui, sans-serif">
          /100
        </text>
        <g className="pioni-demo-bars-h">
          <rect className="pioni-demo-hb" x="156" y="48" width="128" height="10" rx="5" fill="#E8E8E8" />
          <rect className="pioni-demo-hb-fill" x="156" y="48" width="92" height="10" rx="5" fill="#2A2A2A" />
          <rect className="pioni-demo-hb" x="156" y="72" width="128" height="10" rx="5" fill="#E8E8E8" />
          <rect className="pioni-demo-hb-fill" x="156" y="72" width="70" height="10" rx="5" fill="#6A6A6A" />
          <rect className="pioni-demo-hb" x="156" y="96" width="128" height="10" rx="5" fill="#E8E8E8" />
          <rect className="pioni-demo-hb-fill" x="156" y="96" width="108" height="10" rx="5" fill="#0A0A0A" />
        </g>
        <g className="pioni-demo-nav-pill">
          <rect x="156" y="118" width="88" height="18" rx="9" fill="#0A0A0A" />
          <text x="170" y="130" fill="#FFFFFF" fontSize="9" fontFamily="'Archivo Variable', system-ui, sans-serif">
            Sentiment →
          </text>
        </g>
      </g>
    </Frame>
  );
}

export default function TourStepDemo({
  stepId,
  className,
}: {
  stepId: string;
  className?: string;
}) {
  switch (stepId) {
    case "chart":
      return <ChartDemo className={className} />;
    case "balance":
      return <BalanceDemo className={className} />;
    case "order-ticket":
      return <OrderDemo className={className} />;
    case "positions":
      return <PositionsDemo className={className} />;
    case "sentiment":
      return <SentimentDemo className={className} />;
    default:
      return null;
  }
}
