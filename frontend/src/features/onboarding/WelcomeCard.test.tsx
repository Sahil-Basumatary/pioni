import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import WelcomeIllustration from "./WelcomeIllustration";

describe("WelcomeIllustration", () => {
  it("renders custom paper-trading artwork", () => {
    const { container } = render(<WelcomeIllustration className="w-full" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 480 280");
    expect(container.querySelector(".pioni-welcome-bars")).toBeTruthy();
    expect(container.querySelector(".pioni-welcome-chip")).toBeTruthy();
  });
});
