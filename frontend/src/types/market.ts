export interface Kline {
  symbol: string;
  exchange: string;
  interval: string;
  open_time: number;
  close_time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quote_volume: string;
  trades: number;
  is_closed: boolean;
}

export interface Trade {
  symbol: string;
  exchange: string;
  price: string;
  quantity: string;
  timestamp: number;
  buyer_maker: boolean;
  latency?: MarketLatencyMetadata;
}

export interface MarketLatencyMetadata {
  exchange_at_ms?: number;
  market_received_at_ms?: number;
  market_published_at_ms?: number;
  gateway_received_at_ms?: number;
  gateway_sent_at_ms?: number;
  browser_received_at_ms?: number;
  browser_received_perf_ms?: number;
}

export interface TickerSnapshot {
  symbol: string;
  exchange: string;
  price: string;
  change_24h: string | null;
  change_pct_24h: number | null;
  high_24h: string | null;
  low_24h: string | null;
  volume_24h: string | null;
  updated_at: number;
}

export interface KlinesResponse {
  symbol: string;
  interval: string;
  klines: Kline[];
}

interface WSConnected {
  type: "connected";
  message: string;
}

interface WSSubscribed {
  type: "subscribed";
  symbols: string[];
}

interface WSUnsubscribed {
  type: "unsubscribed";
  symbols: string[];
}

interface WSTrade {
  type: "trade";
  symbol: string;
  data: Trade;
}

interface WSKline {
  type: "kline";
  symbol: string;
  interval: string;
  data: Kline;
}

interface WSError {
  type: "error";
  message: string;
}

export type WSMessage =
  | WSConnected
  | WSSubscribed
  | WSUnsubscribed
  | WSTrade
  | WSKline
  | WSError;

export interface WSSubscribeCommand {
  action: "subscribe";
  symbols: string[];
}

export interface WSUnsubscribeCommand {
  action: "unsubscribe";
  symbols: string[];
}

export type WSCommand = WSSubscribeCommand | WSUnsubscribeCommand;
