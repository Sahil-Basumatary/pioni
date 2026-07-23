import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { DEFAULT_TOUR_STEPS } from "./tourSteps";
import { useTour } from "./TourProvider";

describe("tour foundation", () => {
  it("exposes five default stub steps with data-tour selectors", () => {
    expect(DEFAULT_TOUR_STEPS).toHaveLength(5);
    for (const step of DEFAULT_TOUR_STEPS) {
      expect(step.element).toMatch(/^\[data-tour="/);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it("requires TourProvider for useTour", () => {
    expect(() => renderHook(() => useTour())).toThrow(
      /TourProvider/,
    );
  });
});
