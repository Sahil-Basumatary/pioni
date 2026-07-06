import http from "k6/http";
import { check } from "k6";
import { GATEWAY_URL, stagesFromEnv } from "./lib/config.js";

// Diagnostic: /health runs the same gateway middleware stack as /market/prices but does NO
// upstream proxy hop. Comparing the two under identical load isolates middleware/event-loop cost
// from the cost of the synchronous call to the market-data service.
export const options = {
  stages: stagesFromEnv(),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<50", "p(99)<100"],
  },
};

export default function () {
  const res = http.get(`${GATEWAY_URL}/health`);
  check(res, { "status is 200": (r) => r.status === 200 });
}
