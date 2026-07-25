import type {
  PortfolioLedgerEntry,
  PortfolioTrade,
} from "../portfolio/portfolioApi";
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

const ENTRY_TYPE_LABEL: Record<string, string> = {
  trade_buy: "Trade buy",
  trade_sell: "Trade sell",
};

function signedAmount(n: number, ticker: string): string {
  if (!Number.isFinite(n) || n === 0) return `0 ${ticker}`;
  const sign = n > 0 ? "" : "−";
  return `${sign}${Math.abs(n)} ${ticker}`;
}

export function rowsFromLedgerEntries(entries: PortfolioLedgerEntry[]): LedgerRow[] {
  return entries.map((entry) => {
    const amount = Number(entry.amount);
    const fee = Number(entry.fee);
    const balance = Number(entry.balance_after);
    return {
      id: entry.id,
      type: ENTRY_TYPE_LABEL[entry.entry_type] ?? entry.entry_type,
      wallet: entry.wallet,
      asset: entry.asset || ASSET_NAME[entry.ticker] || entry.ticker,
      ticker: entry.ticker,
      amount: signedAmount(amount, entry.ticker),
      fee:
        entry.ticker === "USD"
          ? `${Number.isFinite(fee) ? fee : entry.fee} USD`
          : "—",
      balance: Number.isFinite(balance)
        ? `${balance} ${entry.ticker}`
        : `— ${entry.ticker}`,
      at: entry.executed_at,
    };
  });
}

/**
 * Fallback when ledger rows are not yet available for older fills. Balance stays "—"
 * because only the portfolio ledger table stores balance_after.
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
