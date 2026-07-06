import http from "k6/http";
import { check } from "k6";
import { GATEWAY_URL, stagesFromEnv } from "./lib/config.js";

export const options = {
  stages: stagesFromEnv(),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200", "p(99)<500"],
  },
};

export default function () {
  const res = http.get(`${GATEWAY_URL}/market/prices`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "body is json object": (r) => {
      try {
        return typeof r.json() === "object";
      } catch {
        return false;
      }
    },
  });
}
