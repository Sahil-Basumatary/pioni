export const OTC_MIN_USD = 50_000;
export const OTC_RFQ_EXPOSURE_USD = 1_000_000;
export const OTC_OVERALL_EXPOSURE_USD = 1_500_000;

const OTC_QUOTES = ["AUD", "CAD", "EUR", "GBP", "USD", "USDC", "USDT"] as const;

const OTC_BASES_STANDARD = [
  "ADA",
  "ALGO",
  "APT",
  "ARB",
  "ATOM",
  "AVAX",
  "BCH",
  "BTC",
  "DOGE",
  "DOT",
  "FLOW",
  "INJ",
  "LINK",
  "LTC",
  "POL",
  "TIA",
  "XLM",
  "XRP",
  "XTZ",
] as const;

export type OtcPortalPair = {
  id: string;
  label: string;
  base: string;
  quote: string;
  symbol: string;
};

function liveSymbol(base: string, quote: string): string {
  if (quote === "BTC") return `${base}BTC`;
  if (quote === "ETH") return `${base}ETH`;
  if (quote === "USDT" || quote === "USD" || quote === "USDC") return `${base}USDT`;
  if (base === "USDC" && quote === "USDT") return "USDCUSDT";
  if (base === "USDT") return "BTCUSDT";
  return `${base}USDT`;
}

function pair(base: string, quote: string): OtcPortalPair {
  return {
    id: `${base}${quote}`,
    label: `${base}/${quote}`,
    base,
    quote,
    symbol: liveSymbol(base, quote),
  };
}

function expandQuotes(base: string, quotes: readonly string[]): OtcPortalPair[] {
  return quotes.map((q) => pair(base, q));
}

export const OTC_PORTAL_PAIRS: OtcPortalPair[] = [
  ...OTC_BASES_STANDARD.flatMap((b) => expandQuotes(b, OTC_QUOTES)),
  ...expandQuotes("ETH", ["AUD", "BTC", "CAD", "EUR", "GBP", "USD", "USDC", "USDT"]),
  ...expandQuotes("SOL", ["AUD", "BTC", "CAD", "ETH", "EUR", "GBP", "USD", "USDC", "USDT"]),
  ...expandQuotes("USDC", ["AUD", "CAD", "EUR", "GBP", "USD", "USDT"]),
  ...expandQuotes("USDT", ["AUD", "CAD", "EUR", "GBP", "USD"]),
].sort((a, b) => a.label.localeCompare(b.label));

export const OTC_PORTAL_FAQ = [
  {
    q: "What is Pioni OTC?",
    a: "Pioni Over-The-Counter Trading is a private and personalized paper service to practice large orders at competitive simulated pricing with minimum market impact. You get access to deep practice liquidity and flexible settlement arrangements.",
  },
  {
    q: "How can I trade with Pioni OTC?",
    a: "You can practice with us via the simulated OTC desk chat flow, or via our automated RFQ (Request-For-Quote).",
  },
  {
    q: "What is the minimum trade amount?",
    a: "The minimum trade amount is an equivalent value of 50,000 USD. RFQ allows you to trade up to 1,000,000 USD. For trades above 1,000,000 USD, use the paper OTC desk chat preview or raise your simulated exposure.",
  },
  {
    q: "Is there a fee?",
    a: "We do not charge a fee.",
  },
  {
    q: "How many times can I request a quote?",
    a: "You can request a quote as many times as you’d like. The quote duration will vary depending on market volatility.",
  },
  {
    q: "What cryptocurrencies can I trade with Pioni OTC?",
    a: "RFQ supports 23 paper assets across major quote currencies. Practice restrictions may apply to some quote currencies. Chat trading preview supports asset pairs listed on the Pioni platform (with some exceptions).",
  },
] as const;

export const OTC_PORTAL_BENEFITS = [
  {
    id: "chat",
    title: "Chat trading and flex settlement",
    body: "Execute large trades via chat with our OTC desk, and settle on your schedule.",
  },
  {
    id: "lending",
    title: "OTC Lending",
    body: "Access crypto-backed loans from 500K USD, tailored for institutions and high-net-worth clients.",
  },
] as const;

const UNLOCK_KEY = "pioni-otc-unlocked";

export function isOtcUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOtcUnlocked(value: boolean): void {
  try {
    if (value) localStorage.setItem(UNLOCK_KEY, "1");
    else localStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function formatOtcUsd(n: number, digits = 2): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}USD`;
}

export function filterOtcPairs(query: string): OtcPortalPair[] {
  const q = query.trim().toUpperCase().replace(/\s+/g, "");
  if (!q) return OTC_PORTAL_PAIRS;
  return OTC_PORTAL_PAIRS.filter((p) => {
    const compact = `${p.base}${p.quote}`;
    const labeled = p.label.replace("/", "");
    return (
      p.label.toUpperCase().includes(q) ||
      compact.includes(q) ||
      labeled.includes(q) ||
      p.base.includes(q) ||
      p.quote.includes(q)
    );
  });
}
