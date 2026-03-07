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
  type: "news" | "reddit";
  title: string;
  source?: string;
  score?: number;
  ago?: string;
}

export interface SentimentData {
  ticker: string;
  sentiment: number;
  confidence: number;
  n_news?: number;
  n_reddit?: number;
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
