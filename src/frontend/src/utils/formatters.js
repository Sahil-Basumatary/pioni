export const cacheLabel = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "MISS":
      return "Fresh";
    case "HIT":
      return "Cached";
    case "STALE":
      return "Refreshing";
    case "MOCK":
      return "Mock";
    default:
      return "—";
  }
};

export const formatSigned = (n, decimals = 2) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}`;
};

export const formatAsOf = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
  } catch {
    return "—";
  }
};

export const timeAgoFromIso = (iso) => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

export const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));

export const pct = (x) => `${Math.round(clamp01(x) * 100)}%`;


