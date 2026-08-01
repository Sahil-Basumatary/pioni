import { MARKET_SYMBOLS } from "./catalog";

export const FAVORITES_STORAGE_KEY = "pioni.marketFavorites";

const ALLOWED = new Set(MARKET_SYMBOLS);

export function normalizeFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const symbol = item.trim().toUpperCase();
    if (!ALLOWED.has(symbol) || seen.has(symbol)) continue;
    seen.add(symbol);
    out.push(symbol);
  }
  return out;
}

export function mergeFavorites(server: string[], local: string[]): string[] {
  return normalizeFavorites([...server, ...local]);
}

export function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    return normalizeFavorites(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function writeFavorites(symbols: string[]): void {
  try {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(normalizeFavorites(symbols)),
    );
  } catch {
    // private mode / quota — keep in-memory state only
  }
}

export function toggleFavorite(symbol: string, current: string[]): string[] {
  const upper = symbol.toUpperCase();
  if (!ALLOWED.has(upper)) {
    return normalizeFavorites(current);
  }
  const normalized = normalizeFavorites(current);
  return normalized.includes(upper)
    ? normalized.filter((s) => s !== upper)
    : [...normalized, upper];
}
