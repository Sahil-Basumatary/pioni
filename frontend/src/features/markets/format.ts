export function formatMarketPrice(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  }
  if (n >= 1) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export function formatChangePct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toFixed(2);
  return n > 0 ? `+${abs}%` : n < 0 ? `-${abs}%` : `${abs}%`;
}

export function formatVolume(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatFundingRate(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toFixed(2);
  const sign = n > 0 ? "" : n < 0 ? "-" : "";
  return `${sign}${abs}%/hr`;
}

export function sparklinePoints(
  changePct: number | null,
  seed: string,
  count = 24,
): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const drift = (changePct ?? 0) / 100;
  const points: number[] = [];
  let v = 50;
  for (let i = 0; i < count; i += 1) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const noise = ((h % 1000) / 1000 - 0.5) * 8;
    v += drift * 4 + noise;
    points.push(v);
  }
  return points;
}

export function sparklinePath(points: number[], width: number, height: number): string {
  if (!points.length) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / span) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
