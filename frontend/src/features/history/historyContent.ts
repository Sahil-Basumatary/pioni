export type HistoryScope = "main" | "earn" | "otc";
export type HistorySection = "ledger" | "orders" | "trades" | "positions";

export type LedgerRow = {
  id: string;
  type: string;
  wallet: string;
  asset: string;
  ticker: string;
  amount: string;
  fee: string;
  balance: string;
};

export type OrderRow = {
  id: string;
  side: string;
  type: string;
  status: string;
  quantity: string;
  cost: string;
};

export type TradeRow = {
  id: string;
  side: string;
  type: string;
  market: string;
  marketName: string;
  volume: string;
  cost: string;
};

export const LEDGER_COLUMNS = [
  "Type",
  "Wallet",
  "Asset",
  "Ticker",
  "Amount",
  "Fee",
  "Balance",
  "ID",
] as const;

export const ORDER_COLUMNS = [
  "Side",
  "Type",
  "Status",
  "Quantity executed",
  "Cost",
  "ID",
] as const;

export const TRADE_COLUMNS = [
  "Side",
  "Type",
  "Market",
  "Volume",
  "Cost",
  "ID",
] as const;

export const PAPER_LEDGER: LedgerRow[] = [
  {
    id: "LKCP73",
    type: "Rewards",
    wallet: "Spot",
    asset: "Babylon",
    ticker: "BABY",
    amount: "0.01571 BABY",
    fee: "0.00471 BABY",
    balance: "0.43089 BABY",
  },
  {
    id: "LHULVP",
    type: "Rewards",
    wallet: "Spot",
    asset: "Babylon",
    ticker: "BABY",
    amount: "0.01571 BABY",
    fee: "0.00471 BABY",
    balance: "0.41989 BABY",
  },
  {
    id: "LL4RV3",
    type: "Rewards",
    wallet: "Spot",
    asset: "Babylon",
    ticker: "BABY",
    amount: "0.01590 BABY",
    fee: "0.00477 BABY",
    balance: "0.40889 BABY",
  },
  {
    id: "L6S6AC",
    type: "Withdrawal",
    wallet: "Spot",
    asset: "Bitcoin",
    ticker: "BTC",
    amount: "-0.0011641 BTC",
    fee: "0.000015 BTC",
    balance: "0.0009156 BTC",
  },
  {
    id: "LI3O54",
    type: "Instant",
    wallet: "Spot",
    asset: "Bitcoin",
    ticker: "BTC",
    amount: "0.00127354 BTC",
    fee: "0 BTC",
    balance: "0.0020947 BTC",
  },
];

export const PAPER_ORDERS: OrderRow[] = [];

export const PAPER_TRADES: TradeRow[] = [
  {
    id: "TY4JAH",
    side: "Buy",
    type: "Market",
    market: "BTC/USD",
    marketName: "Bitcoin",
    volume: "0.00098573 BTC",
    cost: "68 USD",
  },
  {
    id: "TFHVHJ",
    side: "Buy",
    type: "Market",
    market: "BTC/USD",
    marketName: "Bitcoin",
    volume: "0.00083655 BTC",
    cost: "56.6 USD",
  },
];

export function sectionsForScope(scope: HistoryScope): HistorySection[] {
  if (scope === "main") return ["ledger", "orders", "trades", "positions"];
  return ["ledger"];
}

export function filtersForSection(section: HistorySection): string[] {
  if (section === "ledger") return ["Assets", "Types", "Date"];
  if (section === "orders") return ["Market", "Types", "Date"];
  if (section === "trades") return ["Market", "Date"];
  return ["Market", "Date"];
}
