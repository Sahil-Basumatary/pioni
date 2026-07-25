import type { PortfolioTrade } from "../portfolio/portfolioApi";
import { baseAsset } from "../../components/shell/activityFormat";

export type HistoryScope = "main" | "earn" | "otc";
export type HistorySection = "ledger" | "orders" | "trades" | "positions";

export type LedgerRow = {
  id: string;
  type: string;
  wallet: string;
  asset: string;
  amount: string;
  fee: string;
  at: string;
};

export const LEDGER_COLUMNS = [
  "Type",
  "Wallet",
  "Asset",
  "Amount",
  "Fee",
  "Date",
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
  "Date",
  "ID",
] as const;

/**
 * Every fill moves two balances, so one trade becomes two ledger rows. Deposits and
 * withdrawals are not implemented, so fills are currently the only source of ledger activity.
 */
export function ledgerFromTrades(trades: PortfolioTrade[]): LedgerRow[] {
  return trades.flatMap((trade) => {
    const asset = baseAsset(trade.symbol);
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
        asset,
        amount: `${sign(qty, isBuy)} ${asset}`,
        fee: "—",
        at: trade.executed_at,
      },
      {
        id: `${trade.id}-cash`,
        type: isBuy ? "Trade buy" : "Trade sell",
        wallet: "Spot",
        asset: "USD",
        amount: `${sign(Number(cash.toFixed(2)), !isBuy)} USD`,
        fee: `${trade.fee} USD`,
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
