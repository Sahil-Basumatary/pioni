export type MarketMeta = {
  symbol: string;
  label: string;
  name: string;
  category: string;
  marginLeverage?: number;
  futuresLeverage?: number;
};

export const MARKET_CATALOG: MarketMeta[] = [
  {
    symbol: "BTCUSDT",
    label: "BTC",
    name: "Bitcoin",
    category: "Payment and value",
    marginLeverage: 10,
    futuresLeverage: 100,
  },
  {
    symbol: "ETHUSDT",
    label: "ETH",
    name: "Ether",
    category: "Layer 1",
    marginLeverage: 10,
    futuresLeverage: 100,
  },
  {
    symbol: "SOLUSDT",
    label: "SOL",
    name: "Solana",
    category: "Layer 1",
    marginLeverage: 10,
    futuresLeverage: 50,
  },
  {
    symbol: "XRPUSDT",
    label: "XRP",
    name: "XRP",
    category: "Payment and value",
    marginLeverage: 10,
    futuresLeverage: 50,
  },
  {
    symbol: "ADAUSDT",
    label: "ADA",
    name: "Cardano",
    category: "Layer 1",
    marginLeverage: 10,
    futuresLeverage: 50,
  },
  {
    symbol: "DOGEUSDT",
    label: "DOGE",
    name: "Dogecoin",
    category: "Culture",
    marginLeverage: 10,
    futuresLeverage: 50,
  },
  {
    symbol: "LTCUSDT",
    label: "LTC",
    name: "Litecoin",
    category: "Payment and value",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "LINKUSDT",
    label: "LINK",
    name: "Chainlink",
    category: "Infrastructure",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "AVAXUSDT",
    label: "AVAX",
    name: "Avalanche",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 50,
  },
  {
    symbol: "DOTUSDT",
    label: "DOT",
    name: "Polkadot",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "APTUSDT",
    label: "APT",
    name: "Aptos",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "ATOMUSDT",
    label: "ATOM",
    name: "Cosmos",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "BCHUSDT",
    label: "BCH",
    name: "Bitcoin Cash",
    category: "Payment and value",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "POLUSDT",
    label: "POL",
    name: "Polygon",
    category: "Layer 2",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "XLMUSDT",
    label: "XLM",
    name: "Stellar",
    category: "Payment and value",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "ARBUSDT",
    label: "ARB",
    name: "Arbitrum",
    category: "Layer 2",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "ALGOUSDT",
    label: "ALGO",
    name: "Algorand",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "INJUSDT",
    label: "INJ",
    name: "Injective",
    category: "Infrastructure",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "TIAUSDT",
    label: "TIA",
    name: "Celestia",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "FLOWUSDT",
    label: "FLOW",
    name: "Flow",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
  {
    symbol: "XTZUSDT",
    label: "XTZ",
    name: "Tezos",
    category: "Layer 1",
    marginLeverage: 5,
    futuresLeverage: 25,
  },
];

export const MARKET_SYMBOLS = MARKET_CATALOG.map((m) => m.symbol);

export function getMarketMeta(symbol: string): MarketMeta | undefined {
  return MARKET_CATALOG.find((m) => m.symbol.toUpperCase() === symbol.toUpperCase());
}

export type ForexMeta = {
  symbol: string;
  label: string;
  quote: string;
  name: string;
  category: string;
  mid: number;
  volume: number;
};

export const FOREX_CATALOG: ForexMeta[] = [
  {
    symbol: "EURUSD",
    label: "EUR",
    quote: "USD",
    name: "Euro",
    category: "Forex",
    mid: 1.13737,
    volume: 30_782_700,
  },
  {
    symbol: "GBPUSD",
    label: "GBP",
    quote: "USD",
    name: "Pound Sterling",
    category: "Forex",
    mid: 1.33094,
    volume: 3_235_400,
  },
  {
    symbol: "USDCAD",
    label: "USD",
    quote: "CAD",
    name: "US Dollar",
    category: "Forex",
    mid: 1.3682,
    volume: 2_140_200,
  },
  {
    symbol: "AUDUSD",
    label: "AUD",
    quote: "USD",
    name: "Australian Dollar",
    category: "Forex",
    mid: 0.6485,
    volume: 1_890_100,
  },
  {
    symbol: "EURGBP",
    label: "EUR",
    quote: "GBP",
    name: "Euro",
    category: "Forex",
    mid: 0.8541,
    volume: 980_400,
  },
  {
    symbol: "EURCHF",
    label: "EUR",
    quote: "CHF",
    name: "Euro",
    category: "Forex",
    mid: 0.9412,
    volume: 720_300,
  },
  {
    symbol: "USDCHF",
    label: "USD",
    quote: "CHF",
    name: "US Dollar",
    category: "Forex",
    mid: 0.8275,
    volume: 1_120_800,
  },
  {
    symbol: "USDJPY",
    label: "USD",
    quote: "JPY",
    name: "US Dollar",
    category: "Forex",
    mid: 147.32,
    volume: 4_560_200,
  },
];
