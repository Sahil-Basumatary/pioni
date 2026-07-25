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

/** Returns null when either leg has no live price, so the caller can block the quote. */
export function quoteReceive(
  fromAmount: number,
  fromUsdPrice: number | null,
  toUsdPrice: number | null,
): number | null {
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) return null;
  if (fromUsdPrice == null || toUsdPrice == null) return null;
  if (fromUsdPrice <= 0 || toUsdPrice <= 0) return null;
  return (fromAmount * fromUsdPrice) / toUsdPrice;
}

export function formatConvertAmount(n: number | null, symbol: string): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "";
  const digits = symbol === "USD" ? 2 : n < 1 ? 8 : 6;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
