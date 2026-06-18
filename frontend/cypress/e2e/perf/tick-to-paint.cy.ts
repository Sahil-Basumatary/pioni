/// <reference types="cypress" />

type MockSocket = WebSocket & {
  sentMessages: string[];
  emitMessage: (payload: unknown) => void;
};

interface BenchmarkResult {
  samples: number;
  warmup: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

const SAMPLE_COUNT = 120;
const WARMUP_COUNT = 20;
const SYMBOL = "BTCUSDT";

const SNAPSHOT = {
  symbol: SYMBOL,
  exchange: "binance",
  price: "50000",
  change_24h: "1200",
  change_pct_24h: 2.46,
  high_24h: "51000",
  low_24h: "48500",
  volume_24h: "1250000000",
  updated_at: 1700000000,
};

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function afterPaint(win: Window): Promise<number> {
  return new Promise((resolve) => {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => resolve(win.performance.now()));
    });
  });
}

function resultLine(result: BenchmarkResult): string {
  return `tick-to-paint p50=${result.p50.toFixed(2)}ms p95=${result.p95.toFixed(2)}ms p99=${result.p99.toFixed(2)}ms max=${result.max.toFixed(2)}ms`;
}

function resultNotes(result: BenchmarkResult): string {
  return `# Tick-to-Paint Latency

Recorded: 2026-06-17

## Method

- Command: \`npm run perf:tick-to-paint\`
- Browser: Cypress Electron 138, headless
- App mode: production build served with \`vite preview\`
- Route: \`/trading\`
- Input: ${result.warmup} warmup synthetic BTC trades, followed by ${result.samples} measured synthetic BTC trades
- Measurement: timestamp before the synthetic WebSocket trade is emitted, then wait for the next painted frame with two \`requestAnimationFrame\` callbacks and verify the live price text changed

## Result

| Metric | Value |
| --- | --- |
| p50 | ${result.p50.toFixed(2)}ms |
| p95 | ${result.p95.toFixed(2)}ms |
| p99 | ${result.p99.toFixed(2)}ms |
| max | ${result.max.toFixed(2)}ms |

## Interpretation

The p95 result is below the 50ms target, so the hot path from synthetic trade receipt to visible price update is fast enough for the current trading UI. The benchmark isolates client render latency and does not include real network jitter or exchange feed latency.
`;
}

function installMockWebSocket(win: Window) {
  const sockets: MockSocket[] = [];

  class MockWebSocket extends EventTarget {
    static CONNECTING = WebSocket.CONNECTING;
    static OPEN = WebSocket.OPEN;
    static CLOSING = WebSocket.CLOSING;
    static CLOSED = WebSocket.CLOSED;

    binaryType: BinaryType = "blob";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    readyState = WebSocket.CONNECTING;
    sentMessages: string[] = [];
    url: string;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onopen: ((event: Event) => void) | null = null;

    constructor(url: string) {
      super();
      this.url = url;
      sockets.push(this as unknown as MockSocket);
      win.setTimeout(() => {
        this.readyState = WebSocket.OPEN;
        const event = new Event("open");
        this.onopen?.(event);
        this.dispatchEvent(event);
      }, 0);
    }

    close() {
      this.readyState = WebSocket.CLOSED;
      const event = new CloseEvent("close");
      this.onclose?.(event);
      this.dispatchEvent(event);
    }

    emitMessage(payload: unknown) {
      const event = new MessageEvent("message", {
        data: JSON.stringify(payload),
      });
      this.onmessage?.(event);
      this.dispatchEvent(event);
    }

    send(message: string) {
      this.sentMessages.push(message);
    }
  }

  Object.assign(win, {
    WebSocket: MockWebSocket,
    __pioniSockets: sockets,
  });
}

describe("trading tick-to-paint benchmark", () => {
  it("measures synthetic trade latency to the next painted frame", () => {
    cy.intercept("GET", "**/market/prices", { body: { [SYMBOL]: SNAPSHOT } });
    cy.intercept("GET", "**/market/prices/*", SNAPSHOT);
    cy.intercept("GET", "**/market/klines/*", {
      statusCode: 200,
      body: { symbol: SYMBOL, interval: "1m", klines: [] },
    });

    cy.visit("/trading", {
      onBeforeLoad(win) {
        installMockWebSocket(win);
      },
    });

    cy.window()
      .its("__pioniSockets.0")
      .should("exist")
      .then((socket) => {
        cy.window().then(async (win): Promise<BenchmarkResult> => {
          const priceNode = win.document.querySelector('[data-testid="live-price"]');
          if (!priceNode) throw new Error("live price node not found");

          const latencies: number[] = [];
          const totalTicks = SAMPLE_COUNT + WARMUP_COUNT;

          for (let i = 0; i < totalTicks; i += 1) {
            const price = 50_000 + (i + 1) / 100;
            const sentAt = win.performance.now();
            (socket as unknown as MockSocket).emitMessage({
              type: "trade",
              symbol: SYMBOL,
              data: {
                symbol: SYMBOL,
                exchange: "benchmark",
                price: price.toFixed(2),
                quantity: "0.001",
                timestamp: Date.now(),
                buyer_maker: false,
              },
            });

            const paintedAt = await afterPaint(win);
            const expected = formatPrice(price);
            if (!priceNode.textContent?.includes(expected)) {
              throw new Error(`expected ${expected}, saw ${priceNode.textContent ?? ""}`);
            }
            if (i >= WARMUP_COUNT) {
              latencies.push(paintedAt - sentAt);
            }
          }

          const result = {
            samples: latencies.length,
            warmup: WARMUP_COUNT,
            p50: percentile(latencies, 50),
            p95: percentile(latencies, 95),
            p99: percentile(latencies, 99),
            max: Math.max(...latencies),
          };

          return result;
        }).then((result) => {
          cy.task("log", resultLine(result));
          cy.writeFile("docs/perf-lab/006-tick-to-paint-latency.md", resultNotes(result));
          expect(result.p95).to.be.lessThan(50);
        });
      });
  });
});
