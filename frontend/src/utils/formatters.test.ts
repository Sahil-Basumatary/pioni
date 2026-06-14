import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheLabel, clamp01, formatAsOf, formatSigned, pct, timeAgoFromIso } from "./formatters";

describe("formatters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T07:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps cache statuses to user-facing labels", () => {
    expect(cacheLabel("MISS")).toBe("Fresh");
    expect(cacheLabel("hit")).toBe("Cached");
    expect(cacheLabel("STALE")).toBe("Refreshing");
    expect(cacheLabel("mock")).toBe("Mock");
    expect(cacheLabel(null)).toBe("—");
    expect(cacheLabel("unknown")).toBe("—");
  });

  it("formats signed numbers and invalid values", () => {
    expect(formatSigned(1.234)).toBe("+1.23");
    expect(formatSigned(-1.234, 1)).toBe("-1.2");
    expect(formatSigned(0)).toBe("0.00");
    expect(formatSigned("not-a-number")).toBe("—");
  });

  it("formats ISO dates in UTC", () => {
    expect(formatAsOf("2026-06-14T07:05:30Z")).toBe("2026-06-14 07:05 UTC");
    expect(formatAsOf("bad-date")).toBe("—");
    expect(formatAsOf(undefined)).toBe("—");
  });

  it("formats relative time buckets", () => {
    expect(timeAgoFromIso("2026-06-14T07:29:45Z")).toBe("15s ago");
    expect(timeAgoFromIso("2026-06-14T07:15:00Z")).toBe("15m ago");
    expect(timeAgoFromIso("2026-06-14T02:30:00Z")).toBe("5h ago");
    expect(timeAgoFromIso("2026-06-11T07:30:00Z")).toBe("3d ago");
    expect(timeAgoFromIso("not-a-date")).toBe("—");
  });

  it("clamps numeric values and formats percentages", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(undefined)).toBe(0);
    expect(pct(0.424)).toBe("42%");
    expect(pct(2)).toBe("100%");
  });
});
