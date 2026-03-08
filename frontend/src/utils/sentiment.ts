import { clamp01 } from "./formatters";
import type { HistoryPoint, TrendStats, DriverItem, SentimentData, FeedItem } from "../types/sentiment";

export const agreementLabel = (a: number | undefined): string => {
  const v = clamp01(a);
  if (v >= 0.85) return "High agreement";
  if (v >= 0.7) return "Medium agreement";
  return "Low agreement";
};

export const dispersionLabel = (std: number | undefined): string => {
  const v = Number(std) || 0;
  if (v <= 0.12) return "Low dispersion";
  if (v <= 0.25) return "Medium dispersion";
  return "High dispersion";
};

export const deriveTrendStats = (history: HistoryPoint[] = []): TrendStats | null => {
  if (!Array.isArray(history) || history.length < 2) return null;
  const values = history
    .map((p) => Number(p?.score))
    .filter((n): n is number => Number.isFinite(n));
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  const vol = Math.sqrt(variance);
  const delta = last - first;
  const bias = avg > 0.05 ? "Positive" : avg < -0.05 ? "Negative" : "Neutral";
  const direction = delta > 0.02 ? "Improving" : delta < -0.02 ? "Weakening" : "Stable";
  return { first, last, avg, min, max, range, vol, delta, bias, direction };
};

interface PickDriversArgs {
  sentiment: SentimentData | null;
  feed: FeedItem[];
}

export const pickDrivers = ({ sentiment, feed }: PickDriversArgs): DriverItem[] => {
  const highlights = Array.isArray(sentiment?.highlights) ? sentiment!.highlights! : [];
  if (highlights.length) {
    return highlights
      .filter((h) => typeof h?.score === "number" && h?.text)
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
      .slice(0, 4)
      .map((h, idx) => ({
        id: `hl-${idx}`,
        type: h.source === "reddit" ? "reddit" : "news",
        title: h.text,
        source: h.source || "",
        score: h.score,
        ago: "",
      }));
  }
  const items = Array.isArray(feed) ? feed : [];
  return items
    .filter((i): i is FeedItem & { score: number; title: string } =>
      typeof i?.score === "number" && !!i?.title
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 4)
    .map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      source: i.source || "",
      score: i.score,
      ago: i.ago || "",
    }));
};

export const getConfidenceLabel = (value: number): string => {
  if (value < 0.33) return "Low confidence";
  if (value < 0.66) return "Medium confidence";
  return "High confidence";
};

export const getSentimentLabel = (value: number): string => {
  if (value > 0.10) return "Positive";
  if (value < -0.10) return "Negative";
  return "Neutral";
};
