export type MarketMeta = {
  symbol: string;
  label: string;
  name: string;
  category: string;
};

export const MARKET_CATALOG: MarketMeta[] = [
  { symbol: "BTCUSDT", label: "BTC", name: "Bitcoin", category: "Payment and value" },
  { symbol: "ETHUSDT", label: "ETH", name: "Ether", category: "Layer 1" },
  { symbol: "SOLUSDT", label: "SOL", name: "Solana", category: "Layer 1" },
  { symbol: "XRPUSDT", label: "XRP", name: "XRP", category: "Payment and value" },
  { symbol: "ADAUSDT", label: "ADA", name: "Cardano", category: "Layer 1" },
  { symbol: "DOGEUSDT", label: "DOGE", name: "Dogecoin", category: "Culture" },
];

export const MARKET_SYMBOLS = MARKET_CATALOG.map((m) => m.symbol);

export function getMarketMeta(symbol: string): MarketMeta | undefined {
  return MARKET_CATALOG.find((m) => m.symbol === symbol.toUpperCase());
}
