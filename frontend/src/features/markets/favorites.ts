const KEY = "pioni.marketFavorites";

export function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeFavorites(symbols: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(symbols));
}

export function toggleFavorite(symbol: string, current: string[]): string[] {
  const upper = symbol.toUpperCase();
  return current.includes(upper)
    ? current.filter((s) => s !== upper)
    : [...current, upper];
}
