import http from "k6/http";
import { check } from "k6";
import { Trend } from "k6/metrics";
import {
  ORDERS_URL,
  PORTFOLIO_URL,
  LOADTEST_CLERK_ID,
  SYMBOLS,
  stagesFromEnv,
} from "./lib/config.js";

const submitLatency = new Trend("order_submit_latency", true);

export const options = {
  stages: stagesFromEnv(),
  thresholds: {
    http_req_failed: ["rate<0.02"],
    order_submit_latency: ["p(95)<200", "p(99)<500"],
  },
};

// Per-VU state (each VU is its own JS isolate). Every VU trades an isolated portfolio and symbol
// so concurrent submits hit distinct FOR UPDATE rows and distinct matching locks instead of
// serializing on one — the realistic shape where each user trades their own book.
let portfolioId = null;
let symbol = null;

function provision() {
  const clerkId = `${LOADTEST_CLERK_ID}_${__VU}`;
  const res = http.get(`${PORTFOLIO_URL}/me/portfolio`, {
    headers: { "X-Clerk-Id": clerkId },
  });
  if (res.status !== 200) {
    throw new Error(
      `portfolio provisioning failed for VU ${__VU}: ${res.status} ${res.body}`,
    );
  }
  portfolioId = JSON.parse(res.body).id;
  symbol = SYMBOLS[(__VU - 1) % SYMBOLS.length];
}

export default function () {
  if (portfolioId === null) provision();
  // A resting LIMIT BUY far below market exercises the full submit path — validation, portfolio
  // lock, matching, DB write, event publish — without ever crossing, so the book fills but buying
  // power is never exhausted across a long run.
  const payload = JSON.stringify({
    portfolio_id: portfolioId,
    symbol: symbol,
    side: "BUY",
    order_type: "LIMIT",
    time_in_force: "GTC",
    quantity: "0.001",
    price: "1.00",
  });
  const res = http.post(`${ORDERS_URL}/orders`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  submitLatency.add(res.timings.duration);
  check(res, {
    "status is 201": (r) => r.status === 201,
  });
}
