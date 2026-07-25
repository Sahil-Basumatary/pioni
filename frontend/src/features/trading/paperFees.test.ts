import { describe, expect, it } from "vitest";
import { paperFees } from "./paperFees";

describe("paperFees", () => {
  it("shows zero fees on spot and margin paper venues", () => {
    expect(paperFees("spot")).toEqual({ maker: "0.00%", taker: "0.00%" });
    expect(paperFees("margin")).toEqual({ maker: "0.00%", taker: "0.00%" });
  });

  it("shows the futures paper maker and taker schedule", () => {
    expect(paperFees("futures")).toEqual({
      maker: "0.0200%",
      taker: "0.0500%",
    });
  });
});
