import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PortfolioInsights, { fmt } from "./PortfolioInsights";

describe("fmt", () => {
  it("formats finite numbers to 2 decimals", () => {
    expect(fmt(9968.27)).toBe("9,968.27");
  });
  it("uses Pro empty dash", () => {
    expect(fmt(null)).toBe("-");
  });
});

describe("PortfolioInsights", () => {
  it("renders Main Spot Margin and Inverse Futures", () => {
    render(
      <MemoryRouter>
        <PortfolioInsights
          totalValue={9968.27}
          availableMargin={7147.26}
          unrealizedPnl={-31.72}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Spot")).toBeInTheDocument();
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Inverse Futures")).toBeInTheDocument();
    expect(screen.getByText("Available margin")).toBeInTheDocument();
    expect(screen.getByText("Balances UP&L")).toBeInTheDocument();
    expect(screen.getByText("-31.72")).toBeInTheDocument();
  });
});
