import type { PortfolioTrade } from "../portfolio/portfolioApi";

const PAPER_USD_BALANCE = 10_000;
const PAPER_BTC_MID_PRICE = 64_500;

export type PaperActivityItem =
  | { kind: "fill"; id: string; trade: PortfolioTrade }
  | {
      kind: "withdrawal";
      id: string;
      asset: string;
      amount: string;
      quoteAmount: string;
      at: string;
    };

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

/** Dense sample feed when the account has no live fills yet. */
export const PAPER_HOME_ACTIVITY: PaperActivityItem[] = [
  {
    kind: "withdrawal",
    id: "paper-wd-btc",
    asset: "BTC",
    amount: "0.0012",
    quoteAmount: "77.40",
    at: hoursAgo(5),
  },
  {
    kind: "fill",
    id: "paper-fill-1",
    trade: {
      id: "paper-fill-1",
      order_id: "paper-ord-1",
      portfolio_id: "paper",
      symbol: "BTCUSD",
      side: "BUY",
      quantity: "0.0004",
      price: "64500.00",
      fee: "0",
      executed_at: hoursAgo(8),
    },
  },
  {
    kind: "fill",
    id: "paper-fill-2",
    trade: {
      id: "paper-fill-2",
      order_id: "paper-ord-2",
      portfolio_id: "paper",
      symbol: "BTCUSD",
      side: "SELL",
      quantity: "0.00025",
      price: "64120.50",
      fee: "0",
      executed_at: hoursAgo(14),
    },
  },
  {
    kind: "fill",
    id: "paper-fill-3",
    trade: {
      id: "paper-fill-3",
      order_id: "paper-ord-3",
      portfolio_id: "paper",
      symbol: "ETHUSD",
      side: "BUY",
      quantity: "0.02",
      price: "3150.00",
      fee: "0",
      executed_at: hoursAgo(26),
    },
  },
  {
    kind: "fill",
    id: "paper-fill-4",
    trade: {
      id: "paper-fill-4",
      order_id: "paper-ord-4",
      portfolio_id: "paper",
      symbol: "BTCUSD",
      side: "BUY",
      quantity: "0.0005",
      price: "63890.00",
      fee: "0",
      executed_at: hoursAgo(40),
    },
  },
];

export const PAPER_HOME_CASH = PAPER_USD_BALANCE;
export const PAPER_BTC_MID = PAPER_BTC_MID_PRICE;
