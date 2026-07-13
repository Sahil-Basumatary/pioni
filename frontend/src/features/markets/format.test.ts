import { describe, it, expect } from "vitest";
import {
  formatChangePct,
  formatMarketPrice,
  formatVolume,
  sparklinePath,
  sparklinePoints,
} from "./format";

describe("markets format", () => {
  it("formats prices by magnitude", () => {
    expect(formatMarketPrice(63773.4)).toContain("63,773");
    expect(formatMarketPrice(0.9993)).toBe("0.9993");
  });

  it("formats change and volume", () => {
    expect(formatChangePct(1.2)).toBe("+1.20%");
    expect(formatChangePct(-0.5)).toBe("-0.50%");
    expect(formatVolume(36_100_000)).toBe("36.1M");
  });

  it("builds a sparkline path", () => {
    const pts = sparklinePoints(1.5, "BTCUSDT", 8);
    expect(pts).toHaveLength(8);
    expect(sparklinePath(pts, 64, 24)).toMatch(/^M/);
  });
});
