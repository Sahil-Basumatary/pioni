import type { Trade } from "../../types/market";

const MAX_SAMPLES = 500;
const REPORT_EVERY = 50;

export interface MarketLatencySample {
  symbol: string;
  exchangeToBrowserMs?: number;
  exchangeToPaintMs?: number;
  marketToGatewayMs?: number;
  gatewayToBrowserMs?: number;
  browserReceiveToPaintMs: number;
}

export interface MarketStateLatencySample {
  symbol: string;
  browserReceiveToStateMs: number;
}

export interface MarketStoreLatencySample {
  symbol: string;
  browserReceiveToStoreMs: number;
}

export interface MarketLatencySummary {
  samples: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

interface MarketLatencyDebugState {
  readonly samples: MarketLatencySample[];
  readonly storeSamples: MarketStoreLatencySample[];
  readonly stateSamples: MarketStateLatencySample[];
  readonly latestSummary: MarketLatencySummary | null;
  readonly latestStoreSummary: MarketLatencySummary | null;
  readonly latestStateSummary: MarketLatencySummary | null;
  reset: () => void;
}

declare global {
  interface Window {
    __pioniMarketLatency?: MarketLatencyDebugState;
  }
}

const samples: MarketLatencySample[] = [];
const storeSamples: MarketStoreLatencySample[] = [];
const stateSamples: MarketStateLatencySample[] = [];
let latestSummary: MarketLatencySummary | null = null;
let latestStoreSummary: MarketLatencySummary | null = null;
let latestStateSummary: MarketLatencySummary | null = null;

function isEnabled(): boolean {
  return import.meta.env.VITE_MARKET_LATENCY_DEBUG === "true";
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

function summarize(values: number[]): MarketLatencySummary {
  return {
    samples: values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: Math.max(...values),
  };
}

function pushSample(sample: MarketLatencySample): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }

  const paintValues = samples.map((entry) => entry.browserReceiveToPaintMs);
  latestSummary = summarize(paintValues);

  if (samples.length % REPORT_EVERY === 0) {
    console.info("[market-latency] receive-to-paint", {
      samples: latestSummary.samples,
      p50: `${latestSummary.p50.toFixed(2)}ms`,
      p95: `${latestSummary.p95.toFixed(2)}ms`,
      p99: `${latestSummary.p99.toFixed(2)}ms`,
      max: `${latestSummary.max.toFixed(2)}ms`,
      latest: sample,
    });
  }
}

function pushStateSample(sample: MarketStateLatencySample): void {
  stateSamples.push(sample);
  if (stateSamples.length > MAX_SAMPLES) {
    stateSamples.splice(0, stateSamples.length - MAX_SAMPLES);
  }

  const stateValues = stateSamples.map((entry) => entry.browserReceiveToStateMs);
  latestStateSummary = summarize(stateValues);

  if (stateSamples.length % REPORT_EVERY === 0) {
    console.info("[market-latency] receive-to-state", {
      samples: latestStateSummary.samples,
      p50: `${latestStateSummary.p50.toFixed(2)}ms`,
      p95: `${latestStateSummary.p95.toFixed(2)}ms`,
      p99: `${latestStateSummary.p99.toFixed(2)}ms`,
      max: `${latestStateSummary.max.toFixed(2)}ms`,
      latest: sample,
    });
  }
}

function pushStoreSample(sample: MarketStoreLatencySample): void {
  storeSamples.push(sample);
  if (storeSamples.length > MAX_SAMPLES) {
    storeSamples.splice(0, storeSamples.length - MAX_SAMPLES);
  }

  const storeValues = storeSamples.map((entry) => entry.browserReceiveToStoreMs);
  latestStoreSummary = summarize(storeValues);

  if (storeSamples.length % REPORT_EVERY === 0) {
    console.info("[market-latency] receive-to-store", {
      samples: latestStoreSummary.samples,
      p50: `${latestStoreSummary.p50.toFixed(2)}ms`,
      p95: `${latestStoreSummary.p95.toFixed(2)}ms`,
      p99: `${latestStoreSummary.p99.toFixed(2)}ms`,
      max: `${latestStoreSummary.max.toFixed(2)}ms`,
      latest: sample,
    });
  }
}

function installDebugState(): void {
  if (!isEnabled() || typeof window === "undefined" || window.__pioniMarketLatency) {
    return;
  }

  window.__pioniMarketLatency = {
    get samples() {
      return [...samples];
    },
    get storeSamples() {
      return [...storeSamples];
    },
    get stateSamples() {
      return [...stateSamples];
    },
    get latestSummary() {
      return latestSummary;
    },
    get latestStoreSummary() {
      return latestStoreSummary;
    },
    get latestStateSummary() {
      return latestStateSummary;
    },
    reset() {
      samples.length = 0;
      storeSamples.length = 0;
      stateSamples.length = 0;
      latestSummary = null;
      latestStoreSummary = null;
      latestStateSummary = null;
    },
  };
}

export function markTradeBrowserReceived(trade: Trade): Trade {
  if (!isEnabled()) return trade;

  installDebugState();

  return {
    ...trade,
    latency: {
      ...trade.latency,
      browser_received_at_ms: Date.now(),
      browser_received_perf_ms: performance.now(),
    },
  };
}

export function scheduleTradePaintMeasurement(trade: Trade): void {
  if (!isEnabled()) return;

  const latency = trade.latency;
  if (latency?.browser_received_perf_ms === undefined) return;

  requestAnimationFrame(() => {
    const paintedPerfMs = performance.now();
    const browserReceiveToPaintMs = paintedPerfMs - latency.browser_received_perf_ms!;
    const exchangeToBrowserMs = latency.exchange_at_ms && latency.browser_received_at_ms
      ? latency.browser_received_at_ms - latency.exchange_at_ms
      : undefined;

    pushSample({
      symbol: trade.symbol,
      exchangeToBrowserMs,
      exchangeToPaintMs: exchangeToBrowserMs === undefined
        ? undefined
        : exchangeToBrowserMs + browserReceiveToPaintMs,
      marketToGatewayMs: latency.market_published_at_ms && latency.gateway_received_at_ms
        ? latency.gateway_received_at_ms - latency.market_published_at_ms
        : undefined,
      gatewayToBrowserMs: latency.gateway_sent_at_ms && latency.browser_received_at_ms
        ? latency.browser_received_at_ms - latency.gateway_sent_at_ms
        : undefined,
      browserReceiveToPaintMs,
    });
  });
}

export function recordTradeStateMeasurement(trades: Trade[]): void {
  if (!isEnabled()) return;

  installDebugState();

  const stateUpdatedPerfMs = performance.now();
  for (const trade of trades) {
    const receivedPerfMs = trade.latency?.browser_received_perf_ms;
    if (receivedPerfMs === undefined) continue;

    pushStateSample({
      symbol: trade.symbol,
      browserReceiveToStateMs: stateUpdatedPerfMs - receivedPerfMs,
    });
  }
}

export function recordTradeStoreMeasurement(trade: Trade): void {
  if (!isEnabled()) return;

  installDebugState();

  const receivedPerfMs = trade.latency?.browser_received_perf_ms;
  if (receivedPerfMs === undefined) return;

  pushStoreSample({
    symbol: trade.symbol,
    browserReceiveToStoreMs: performance.now() - receivedPerfMs,
  });
}
