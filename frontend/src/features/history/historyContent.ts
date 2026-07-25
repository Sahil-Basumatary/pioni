import type { PortfolioTrade } from "../portfolio/portfolioApi";
import { baseAsset } from "../../components/shell/activityFormat";

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
  at: string;
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
  "Market",
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

const ASSET_NAME: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "XRP",
  USD: "US Dollar",
};

/**
 * Every fill moves two balances, so one trade becomes two ledger rows. Deposits and
 * withdrawals are not implemented, so fills are currently the only source of ledger activity.
 * Balance stays "—" until a running ledger balance is available from the portfolio service.
 */
export function ledgerFromTrades(trades: PortfolioTrade[]): LedgerRow[] {
  return trades.flatMap((trade) => {
    const ticker = baseAsset(trade.symbol);
    const qty = Number(trade.quantity);
    const price = Number(trade.price);
    const isBuy = trade.side === "BUY";
    const cash = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0;
    const sign = (n: number, positive: boolean) =>
      `${positive ? "" : "−"}${Math.abs(n)}`;
    return [
      {
        id: `${trade.id}-asset`,
        type: isBuy ? "Trade buy" : "Trade sell",
        wallet: "Spot",
        asset: ASSET_NAME[ticker] ?? ticker,
        ticker,
        amount: `${sign(qty, isBuy)} ${ticker}`,
        fee: "—",
        balance: "—",
        at: trade.executed_at,
      },
      {
        id: `${trade.id}-cash`,
        type: isBuy ? "Trade buy" : "Trade sell",
        wallet: "Spot",
        asset: ASSET_NAME.USD,
        ticker: "USD",
        amount: `${sign(Number(cash.toFixed(2)), !isBuy)} USD`,
        fee: `${trade.fee} USD`,
        balance: "—",
        at: trade.executed_at,
      },
    ];
  });
}

export function sectionsForScope(scope: HistoryScope): HistorySection[] {
  if (scope === "main") return ["ledger", "orders", "trades", "positions"];
  return ["ledger"];
}

export function filtersForSection(section: HistorySection): string[] {
  if (section === "ledger") return ["Assets", "Types"];
  if (section === "orders") return ["Market", "Types"];
  return ["Market"];
}
