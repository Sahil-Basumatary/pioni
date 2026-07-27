import { describe, expect, it } from "vitest";
import {
  alertMeetsCondition,
  formatAlertCondition,
  formatAlertPair,
  formatAlertPrice,
} from "./alertFormat";

describe("alertFormat", () => {
  it("formats pairs and conditions", () => {
    expect(formatAlertPair("BTCUSDT")).toBe("BTC/USD");
    expect(formatAlertCondition("ABOVE")).toBe("Rises to");
    expect(formatAlertCondition("BELOW")).toBe("Falls to");
    expect(formatAlertPrice("65000.5")).toBe("65,000.5");
  });

  it("evaluates rise and fall conditions", () => {
    expect(alertMeetsCondition("ABOVE", "100", 100)).toBe(true);
    expect(alertMeetsCondition("ABOVE", "100", 99.9)).toBe(false);
    expect(alertMeetsCondition("BELOW", "100", 100)).toBe(true);
    expect(alertMeetsCondition("BELOW", "100", 100.1)).toBe(false);
  });
});
