import { describe, expect, it } from "vitest";
import {
  EVALUATION_FEES,
  formatEvaluationFee,
  plansForWallet,
  resolvePlanId,
} from "./propPlans";

describe("propPlans", () => {
  it("scales evaluation fees with wallet size", () => {
    expect(EVALUATION_FEES[10_000].starter).toBe(85);
    expect(EVALUATION_FEES[50_000].starter).toBe(400);
    expect(EVALUATION_FEES[200_000].intermediate).toBe(1090);
    expect(EVALUATION_FEES[200_000].advanced).toBe(660);
    expect(EVALUATION_FEES[200_000].starter).toBeUndefined();
  });

  it("formats missing starter 200k as unavailable", () => {
    const plans = plansForWallet(200_000);
    expect(plans.find((p) => p.id === "starter")?.evaluationFee).toBe("—");
    expect(plans.find((p) => p.id === "intermediate")?.evaluationFee).toBe(
      "1,090.00 USD",
    );
    expect(formatEvaluationFee(85)).toBe("85.00 USD");
  });

  it("falls back off starter when wallet is 200k", () => {
    expect(resolvePlanId("starter", 200_000)).toBe("intermediate");
    expect(resolvePlanId("advanced", 200_000)).toBe("advanced");
  });
});
