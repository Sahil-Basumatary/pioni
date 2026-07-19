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
    title: "Deep liquidity",
    body: "Access to instant, large-lot pricing and execution.",
    Icon: CandleTradeIcon,
  },
  {
    id: "listings",
    title: "Comprehensive listings",
    body: "Access all asset pairs listed on Pioni or trade 150+ pairs via RFQ.",
    Icon: CoinsIcon,
  },
  {
    id: "settlement",
    title: "Flexible settlement",
    body: "Settle trades within 24 hours using your Pioni account, your bank and/or external wallet.",
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
    a: "Automated OTC trading, offered through our request-for-quote feature (RFQ) in the Pioni paper OTC Portal, enables paper OTC clients to get automated, immediately executable practice quotes for supported cryptoassets",
    bullets: [
      "Request unlimited live practice quotes, execute orders and settle instantly using the funds in your Pioni paper account.",
      "Get a full overview of accepted, rejected and expired RFQ quotes, as well as your full paper OTC order history.",
    ],
  },
  {
    q: "How is RFQ accessed?",
    a: "RFQ is available to paper OTC clients after you unlock OTC. Sign in, unlock from this page, then open the OTC Portal for practice RFQ tickets.",
    sections: [
      {
        title: "OTC Portal in Pioni",
        body: "The OTC Portal is visible to advanced paper OTC clients in Pioni, offering:",
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
        body: "All asset pairs listed on Pioni Markets, such as BTC, ETH, SOL, MATIC, USDT and USDC — simulated only.",
      },
      {
        title: "RFQ",
        body: "OTC Portal: over 20 practice assets, such as BTC, ETH, SOL, MATIC, USDT and USDC. More coming soon!",
      },
    ],
  },
  {
    q: "What is the minimum trade size?",
    a: "The simulated minimum trade amount is an equivalent value of 50,000 USD. There is no simulated maximum size for paper trading",
  },
  {
    q: "Is there a fee?",
    a: "Pioni paper OTC does not charge any trading fees. The bid or offer price we show is the all-inclusive simulated quote.",
  },
  {
    q: "How do I get started?",
    a: "To practice OTC trades over RFQ, sign in to your Pioni paper account and unlock OTC from this page. We do not ask for KYC yet",
  },
  {
    q: "How does settlement work?",
    a: "Paper trade obligations is settled instantly.",
    bullets: [
      "Crypto settles to/from your Pioni paper balances only.",
      "USD and other fiat practice balances settle inside your paper account only.",
      "RFQ offers fully automated practice trade and settlement against funded paper balances: once filled, assets settle into your paper account within seconds.",
    ],
  },
];

export const OTC_RESOURCES = [
  {
    kind: "REPORT",
    title: "Premium solutions for HNWIs and institutions",
    body: "Discover why HNWIs, family offices, hedge funds and asset managers choose Pioni OTC for a strategic edge in maturing crypto markets.",
    cta: "Download",
    image: "/illustrations/otc-resource-report.png?v=7",
  },
  {
    kind: "WEBINAR",
    title: "Monthly strategist call",
    body: "Our Pioni Institutional Monthly Strategist Call provides in-depth analysis of the latest institutional crypto market trends. Watch live or catch up later.",
    cta: "Watch now",
    image: "/illustrations/otc-resource-webinar.png?v=9",
  },
] as const;
