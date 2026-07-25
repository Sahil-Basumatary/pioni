import type { PortfolioTrade } from "../portfolio/portfolioApi";

export const CELEBRATION_FORCE_PARAM = "celebrate";

export type FirstTradeRecap = {
  tradeId: string;
  side: "BUY" | "SELL";
  quantity: string;
  asset: string;
  priceLabel: string;
  headline: string;
  detail: string;
};

function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
}

function formatPrice(price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  });
}

export function buildFirstTradeRecap(trade: PortfolioTrade): FirstTradeRecap {
  const asset = baseAsset(trade.symbol);
  const priceLabel = formatPrice(trade.price);
  const bought = trade.side === "BUY";
  const verb = bought ? "bought" : "sold";
  return {
    tradeId: trade.id,
    side: trade.side,
    quantity: trade.quantity,
    asset,
    priceLabel,
    headline: `You ${verb} ${trade.quantity} ${asset}`,
    detail: `at ${priceLabel} — watch it live in Positions. Paper only, not real money.`,
  };
}

export const DEMO_FIRST_TRADE: PortfolioTrade = {
  id: "demo-first-trade",
  order_id: "demo-order",
  portfolio_id: "demo-portfolio",
  symbol: "BTCUSDT",
  side: "BUY",
  quantity: "0.001",
  price: "64333",
  fee: "0",
  executed_at: new Date().toISOString(),
};

export function wantsForceCelebration(): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get(CELEBRATION_FORCE_PARAM) === "1";
}

export function pickCelebrationTrade(
  trades: PortfolioTrade[] | undefined,
  forceDemo = false,
): PortfolioTrade | null {
  if (forceDemo && !trades?.length) return DEMO_FIRST_TRADE;
  if (!trades?.length) return null;
  return [...trades].sort((a, b) => {
    const ta = new Date(a.executed_at).getTime();
    const tb = new Date(b.executed_at).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  })[0];
}
