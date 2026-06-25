export interface ConfidenceDrivers {
  agreement?: number;
  std?: number;
}

export interface Highlight {
  text: string;
  source?: string;
  score: number;
}

export interface FeedItem {
  id: string;
  type: "news" | "reddit" | "x";
  title: string;
  source?: string;
  score?: number;
  ago?: string;
}

export interface SentimentData {
  ticker: string;
  sentiment: number;
  confidence: number;
  asset_class?: string;
  n_news?: number;
  n_reddit?: number;
  n_x?: number;
  sources?: Record<string, number>;
  confidence_drivers?: ConfidenceDrivers;
  computed_at?: string;
  highlights?: Highlight[];
  feed?: FeedItem[];
}

export interface HistoryPoint {
  date: string;
  score: number;
}

export interface TrendStats {
  first: number;
  last: number;
  avg: number;
  min: number;
  max: number;
  range: number;
  vol: number;
  delta: number;
  bias: string;
  direction: string;
}

export interface DriverItem {
  id: string;
  type: string;
  title: string;
  source: string;
  score: number;
  ago: string;
}

export interface SentimentSignal {
  ticker: string;
  asset_class: string;
  action: "BUY" | "SELL" | "HOLD" | "WATCH" | "BULLISH_WATCH" | "BEARISH_WATCH";
  score: number;
  confidence: number;
  delta: number;
  threshold: number;
  reason: string;
  generated_at: string;
  inputs: {
    sentiment: number;
    previous_sentiment: number;
    confidence: number;
    sources: Record<string, number>;
  };
}
