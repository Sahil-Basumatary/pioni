export type ConvertAsset = {
  id: string;
  symbol: string;
  name: string;
  kind: "fiat" | "crypto";
  icon?: string;
};

export const CONVERT_ASSETS: ConvertAsset[] = [
  { id: "usd", symbol: "USD", name: "US Dollar", kind: "fiat" },
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    kind: "crypto",
    icon: "/icons/assets/btc.webp",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    kind: "crypto",
    icon: "/icons/assets/eth.webp",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    kind: "crypto",
    icon: "/icons/assets/sol.webp",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    kind: "crypto",
    icon: "/icons/assets/xrp.webp",
  },
];

/** Paper mid prices in USD for simulated convert quotes. */
export const PAPER_USD_PRICE: Record<string, number> = {
  USD: 1,
  BTC: 64_500,
  ETH: 3_150,
  SOL: 145,
  XRP: 0.55,
};

export const PAPER_USD_BALANCE = 10_000;

export function quoteReceive(
  fromSymbol: string,
  toSymbol: string,
  fromAmount: number,
): number {
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) return 0;
  const fromUsd = PAPER_USD_PRICE[fromSymbol] ?? 0;
  const toUsd = PAPER_USD_PRICE[toSymbol] ?? 0;
  if (fromUsd <= 0 || toUsd <= 0) return 0;
  return (fromAmount * fromUsd) / toUsd;
}

export function formatConvertAmount(n: number, symbol: string): string {
  if (!Number.isFinite(n) || n === 0) return "";
  const digits = symbol === "USD" ? 2 : n < 1 ? 8 : 6;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
