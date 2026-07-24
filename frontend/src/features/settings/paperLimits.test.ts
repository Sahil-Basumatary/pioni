import { describe, expect, it } from "vitest";
import { PAPER_LIMIT_CARDS } from "./paperLimits";

describe("paperLimits", () => {
  it("exposes static fiat and crypto funding cards", () => {
    expect(PAPER_LIMIT_CARDS).toHaveLength(4);
    expect(PAPER_LIMIT_CARDS.map((c) => c.id)).toEqual([
      "fiat-deposit",
      "fiat-withdrawal",
      "crypto-deposit",
      "crypto-withdrawal",
    ]);
    for (const card of PAPER_LIMIT_CARDS) {
      expect(card.remaining === "Unlimited" || card.remaining === "Not applicable").toBe(
        true,
      );
    }
  });
});
