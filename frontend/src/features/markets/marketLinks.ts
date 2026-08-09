import { MARKET_CATALOG } from "./catalog";

export const DESK_SYMBOL_PARAM = "symbol";

/* Links into the desk carry the pair so they survive a new tab, a bookmark, or a
   shared URL. Dispatching on click would only work for a plain left click. */
export function deskPath(symbol: string): string {
  return `/trading?${DESK_SYMBOL_PARAM}=${encodeURIComponent(symbol)}`;
}

/* Anything arriving from a URL is attacker-controlled, and the resolved symbol
   feeds instrument state and socket subscriptions, so only listed pairs pass. */
export function resolveDeskSymbol(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const wanted = raw.toUpperCase();
  return MARKET_CATALOG.some((market) => market.symbol === wanted) ? wanted : null;
}
