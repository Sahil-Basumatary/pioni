export const GATEWAY_URL = __ENV.GATEWAY_URL || "http://localhost:8000";
export const ORDERS_URL = __ENV.ORDERS_URL || "http://localhost:8003";
export const PORTFOLIO_URL = __ENV.PORTFOLIO_URL || "http://localhost:8004";

// A synthetic identity used only to provision a throwaway paper portfolio for the run; it never
// touches Clerk because the portfolio service trusts the forwarded X-Clerk-Id on the private net.
// Each VU suffixes this with its own id so every VU trades an isolated portfolio.
export const LOADTEST_CLERK_ID = __ENV.LOADTEST_CLERK_ID || "user_loadtest_k6";

// Spreading orders across symbols spreads the per-symbol matching lock. Defaults to the platform's
// real pairs; override with more (even synthetic) symbols to probe the concurrency ceiling.
export const SYMBOLS = (
  __ENV.SYMBOLS || "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT"
).split(",");

// A single ramp -> steady -> drain profile shared by every scenario so results are comparable.
// Tunable per run: VUS (peak virtual users), RAMP, DURATION.
export function stagesFromEnv() {
  const target = Number(__ENV.VUS || 50);
  return [
    { duration: __ENV.RAMP || "30s", target },
    { duration: __ENV.DURATION || "1m", target },
    { duration: "10s", target: 0 },
  ];
}
