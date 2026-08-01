import { describe, expect, it } from "vitest";
import {
  alertConditionKey,
  alertMeetsCondition,
  formatAlertPair,
  formatAlertPrice,
} from "./alertFormat";
import { translate } from "../i18n/translate";

describe("alertFormat", () => {
  it("formats pairs and conditions", () => {
    expect(formatAlertPair("BTCUSDT")).toBe("BTC/USD");
    expect(translate("en-US", alertConditionKey("ABOVE"))).toBe("Rises to");
    expect(translate("en-US", alertConditionKey("BELOW"))).toBe("Falls to");
    expect(formatAlertPrice("65000.5")).toBe("65,000.5");
  });

  it("evaluates rise and fall conditions", () => {
    expect(alertMeetsCondition("ABOVE", "100", 100)).toBe(true);
    expect(alertMeetsCondition("ABOVE", "100", 99.9)).toBe(false);
    expect(alertMeetsCondition("BELOW", "100", 100)).toBe(true);
    expect(alertMeetsCondition("BELOW", "100", 100.1)).toBe(false);
  });
});
