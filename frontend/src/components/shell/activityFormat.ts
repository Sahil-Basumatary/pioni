export function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
}

export function formatTradeHeadline(_side: "BUY" | "SELL", _symbol: string): string {
  return "Order filled";
}

export type TradeDetailParts = {
  sideLabel: "Buy" | "Sell";
  quantity: string;
  asset: string;
  price: string;
  quote: string;
};

export function tradeDetailParts(
  side: "BUY" | "SELL",
  quantity: string,
  price: string,
  symbol: string,
): TradeDetailParts {
  const asset = baseAsset(symbol);
  const qty = Number(quantity);
  const px = Number(price);
  return {
    sideLabel: side === "BUY" ? "Buy" : "Sell",
    quantity: Number.isFinite(qty) ? qty.toString() : quantity,
    asset,
    price: Number.isFinite(px)
      ? px.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : price,
    quote: /USDC$/i.test(symbol) ? "USDC" : /USD$/i.test(symbol) ? "USD" : "USDT",
  };
}

export function formatTradeDetail(
  side: "BUY" | "SELL",
  quantity: string,
  price: string,
  symbol: string,
): string {
  const p = tradeDetailParts(side, quantity, price, symbol);
  return `${p.sideLabel} ${p.quantity} ${p.asset} @ ${p.price}${p.quote}`;
}

export function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

export function formatActivityClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatActivityTime(iso: string): string {
  const datePart = formatActivityDate(iso);
  const timePart = formatActivityClock(iso);
  if (datePart === "—" || timePart === "—") return "—";
  return `${datePart} ${timePart}`;
}

export function assetIconUrl(symbol: string): string {
  const asset = baseAsset(symbol).toLowerCase();
  return `/icons/assets/${asset}.webp`;
}
