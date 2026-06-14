import { describe, expect, it } from "vitest";
import type { FeedItem, HistoryPoint, SentimentData } from "../types/sentiment";
import {
  agreementLabel,
  deriveTrendStats,
  dispersionLabel,
  getConfidenceLabel,
  getSentimentLabel,
  pickDrivers,
} from "./sentiment";

describe("sentiment utilities", () => {
  it("labels agreement and dispersion using stable thresholds", () => {
    expect(agreementLabel(0.9)).toBe("High agreement");
    expect(agreementLabel(0.7)).toBe("Medium agreement");
    expect(agreementLabel(0.69)).toBe("Low agreement");
    expect(dispersionLabel(0.12)).toBe("Low dispersion");
    expect(dispersionLabel(0.25)).toBe("Medium dispersion");
    expect(dispersionLabel(0.26)).toBe("High dispersion");
  });

  it("derives trend stats from finite history values", () => {
    const history: HistoryPoint[] = [
      { date: "2026-06-10", score: -0.2 },
      { date: "2026-06-11", score: 0.1 },
      { date: "2026-06-12", score: 0.4 },
    ];
    const stats = deriveTrendStats(history);
    expect(stats).toMatchObject({
      first: -0.2,
      last: 0.4,
      min: -0.2,
      max: 0.4,
      range: 0.6000000000000001,
      delta: 0.6000000000000001,
      bias: "Positive",
      direction: "Improving",
    });
    expect(stats?.avg).toBeCloseTo(0.1, 4);
    expect(stats?.vol).toBeCloseTo(0.2449, 4);
  });

  it("returns null for insufficient or invalid history", () => {
    expect(deriveTrendStats([])).toBeNull();
    expect(deriveTrendStats([{ date: "2026-06-10", score: 0.1 }])).toBeNull();
    expect(deriveTrendStats([{ date: "a", score: Number.NaN }, { date: "b", score: Number.POSITIVE_INFINITY }])).toBeNull();
  });

  it("prefers sentiment highlights when selecting drivers", () => {
    const sentiment: SentimentData = {
      ticker: "TSLA",
      sentiment: 0.4,
      confidence: 0.8,
      highlights: [
        { text: "Low impact", source: "news", score: 0.1 },
        { text: "Reddit surge", source: "reddit", score: -0.9 },
        { text: "News catalyst", source: "news", score: 0.7 },
      ],
    };
    const drivers = pickDrivers({ sentiment, feed: [] });
    expect(drivers.map((d) => d.title)).toEqual(["Reddit surge", "News catalyst", "Low impact"]);
    expect(drivers[0]).toMatchObject({ id: "hl-0", type: "reddit", source: "reddit", score: -0.9 });
  });

  it("falls back to ranked feed items when highlights are missing", () => {
    const feed: FeedItem[] = [
      { id: "1", type: "news", title: "Small move", source: "Reuters", score: 0.2, ago: "1h ago" },
      { id: "2", type: "reddit", title: "Big concern", source: "r/stocks", score: -0.8 },
      { id: "3", type: "news", title: "No score" },
    ];
    const drivers = pickDrivers({ sentiment: null, feed });
    expect(drivers).toEqual([
      {
        id: "2",
        type: "reddit",
        title: "Big concern",
        source: "r/stocks",
        score: -0.8,
        ago: "",
      },
      {
        id: "1",
        type: "news",
        title: "Small move",
        source: "Reuters",
        score: 0.2,
        ago: "1h ago",
      },
    ]);
  });

  it("labels confidence and sentiment scores", () => {
    expect(getConfidenceLabel(0.2)).toBe("Low confidence");
    expect(getConfidenceLabel(0.5)).toBe("Medium confidence");
    expect(getConfidenceLabel(0.9)).toBe("High confidence");
    expect(getSentimentLabel(0.11)).toBe("Positive");
    expect(getSentimentLabel(-0.11)).toBe("Negative");
    expect(getSentimentLabel(0.1)).toBe("Neutral");
  });
});
