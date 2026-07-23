import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import TourStepDemo from "./TourStepDemo";

describe("TourStepDemo", () => {
  it("renders a looping demo for each tour step", () => {
    for (const id of [
      "chart",
      "balance",
      "order-ticket",
      "positions",
      "sentiment",
    ]) {
      const { container, unmount } = render(<TourStepDemo stepId={id} />);
      expect(container.querySelector("svg")).toBeTruthy();
      unmount();
    }
  });
});
