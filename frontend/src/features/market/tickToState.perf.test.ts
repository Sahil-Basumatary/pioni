import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { setupStore, type AppStore } from "../../app/store";
import { selectLatestTrade, tradeReceived } from "./marketSlice";
import type { Trade, WSMessage } from "../../types/market";

interface BenchmarkResult {
  samples: number;
  warmup: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

const SAMPLE_COUNT = 10_000;
const WARMUP_COUNT = 1_000;
const SYMBOL = "BTCUSDT";
const TARGET_P95_MS = 1;
const RECORD_RESULTS = process.env.PERF_TICK_TO_STATE === "1";

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function makeTrade(index: number): Trade {
  return {
    symbol: SYMBOL,
    exchange: "benchmark",
    price: (50_000 + index / 100).toFixed(2),
    quantity: "0.001",
    timestamp: 1_700_000_000 + index,
    buyer_maker: false,
  };
}

function makeMessage(index: number): string {
  const message: WSMessage = {
    type: "trade",
    symbol: SYMBOL,
    data: makeTrade(index),
  };
  return JSON.stringify(message);
}

function handleTradeMessage(raw: string, store: AppStore): Trade | null {
  const message = JSON.parse(raw) as WSMessage;
  if (message.type !== "trade") return null;
  store.dispatch(tradeReceived(message.data));
  return message.data;
}

function resultLine(result: BenchmarkResult): string {
  return `tick-to-state p50=${result.p50.toFixed(4)}ms p95=${result.p95.toFixed(4)}ms p99=${result.p99.toFixed(4)}ms max=${result.max.toFixed(4)}ms`;
}

function resultNotes(result: BenchmarkResult): string {
  return `# Tick-to-State Latency

Recorded: 2026-06-18

## Method

- Command: \`npm run perf:tick-to-state\`
- Runtime: Vitest on Node.js
- Input: ${result.warmup} warmup synthetic BTC trade messages, followed by ${result.samples} measured messages
- Measurement: timestamp before parsing a synthetic WebSocket trade payload, dispatch it into the real Redux store, then stop the timer after the reducer update returns
- Verification: the latest-trade selector must read back the final measured trade

## Result

| Metric | Value |
| --- | --- |
| p50 | ${result.p50.toFixed(4)}ms |
| p95 | ${result.p95.toFixed(4)}ms |
| p99 | ${result.p99.toFixed(4)}ms |
| max | ${result.max.toFixed(4)}ms |

## Interpretation

This isolates the client data path from browser rendering. It measures parsing and Redux state update latency, not network latency, React commit time, or display refresh timing.
`;
}

function runBenchmark(): BenchmarkResult {
  const store = setupStore();
  const messages = Array.from({ length: SAMPLE_COUNT + WARMUP_COUNT }, (_, index) =>
    makeMessage(index + 1),
  );
  const latencies: number[] = [];
  let lastTrade: Trade | null = null;

  for (let i = 0; i < messages.length; i += 1) {
    const startedAt = performance.now();
    const trade = handleTradeMessage(messages[i], store);
    const updatedAt = performance.now();
    if (trade) lastTrade = trade;
    if (i >= WARMUP_COUNT) {
      latencies.push(updatedAt - startedAt);
    }
  }

  const selected = selectLatestTrade(SYMBOL)(store.getState());
  expect(selected).toEqual(lastTrade);

  return {
    samples: latencies.length,
    warmup: WARMUP_COUNT,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: Math.max(...latencies),
  };
}

describe("market tick-to-state benchmark", () => {
  it("measures synthetic trade parse and Redux update latency", () => {
    const result = runBenchmark();
    expect(result.samples).toBe(SAMPLE_COUNT);

    if (RECORD_RESULTS) {
      const outputPath = resolve(process.cwd(), "docs/perf-lab/007-tick-to-state-latency.md");
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, resultNotes(result));
      console.log(resultLine(result));
      expect(result.p95).toBeLessThan(TARGET_P95_MS);
    }
  });
});
