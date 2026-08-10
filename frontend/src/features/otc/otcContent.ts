import type { ComponentType } from "react";
import {
  CandleTradeIcon,
  CoinsIcon,
  TradeCornersIcon,
} from "../../components/shell/shellIcons";

type WhyIcon = ComponentType<{ className?: string }>;

export const OTC_WHY: {
  id: string;
  title: string;
  body: string;
  Icon: WhyIcon;
}[] = [
  {
    id: "liquidity",
    title: "Large simulated quotes",
    body: "Request a quote without placing an order on the public book.",
    Icon: CandleTradeIcon,
  },
  {
    id: "listings",
    title: "Listed markets",
    body: "Request quotes for supported Pioni markets.",
    Icon: CoinsIcon,
  },
  {
    id: "settlement",
    title: "Paper settlement",
    body: "Filled quotes settle instantly to your simulated balance.",
    Icon: TradeCornersIcon,
  },
];

export const OTC_FAQ: {
  q: string;
  a: string;
  bullets?: string[];
  sections?: { title: string; body: string; bullets?: string[] }[];
}[] = [
  {
    q: "What is the request-for-quote (RFQ) feature?",
    a: "RFQ provides simulated quotes for supported crypto markets.",
    bullets: [
      "Request quotes and fill them against your paper balance.",
      "View accepted, rejected, and expired quotes in OTC history.",
    ],
  },
  {
    q: "How is RFQ accessed?",
    a: "Sign in, open paper OTC, and use the RFQ ticket.",
    sections: [
      {
        title: "OTC Portal in Pioni",
        body: "The OTC Portal includes:",
        bullets: [
          "RFQ access",
          "Simulated price context based on paper market data",
          "Position exposure information against paper balances",
          "Full paper OTC order history",
        ],
      },
      {
        title: "Paper trading only",
        body: "All quotes, fills and history in the OTC Portal are simulated for practice.",
      },
    ],
  },
  {
    q: "What cryptocurrencies do we support?",
    a: "Different assets are available depending on how you would like to practice.",
    sections: [
      {
        title: "Trade over chat (paper desk)",
        body: "Supported Pioni markets, including BTC, ETH, SOL, USDT, and USDC.",
      },
      {
        title: "RFQ",
        body: "More than 20 simulated assets, including BTC, ETH, SOL, USDT, and USDC.",
      },
    ],
  },
  {
    q: "What is the minimum trade size?",
    a: "The simulated minimum order is 50,000 USD. There is no maximum.",
  },
  {
    q: "Is there a fee?",
    a: "No fees are charged. The displayed bid or offer is the simulated quote.",
  },
  {
    q: "How do I get started?",
    a: "Sign in and open paper OTC from this page. No identity check is required.",
  },
  {
    q: "How does settlement work?",
    a: "Filled paper trades settle instantly.",
    bullets: [
      "Crypto settles to/from your Pioni paper balances only.",
      "USD and other fiat practice balances settle inside your paper account only.",
      "Filled RFQs update your paper balance within seconds.",
    ],
  },
];

export const OTC_RESOURCES = [
  {
    kind: "REPORT",
    title: "Paper OTC guide",
    body: "Learn how simulated RFQs, quotes, and settlement work.",
    cta: "Download",
    image: "/illustrations/otc-resource-report.png?v=7",
  },
  {
    kind: "WEBINAR",
    title: "OTC market overview",
    body: "Review the markets available in the paper OTC portal.",
    cta: "Watch now",
    image: "/illustrations/otc-resource-webinar.png?v=9",
  },
] as const;
