import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MarketingFooter from "./MarketingFooter";

/* Kept in sync with the routes registered in App.tsx. A footer link that points
   at nothing is worse than no link at all. */
const ROUTES = new Set([
  "/",
  "/trading",
  "/trade/margin",
  "/markets",
  "/sign-in",
  "/sign-up",
  "/help",
  "/rules",
  "/fees",
  "/api",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
]);

describe("MarketingFooter", () => {
  it("points every link at a registered route", () => {
    render(
      <MemoryRouter>
        <MarketingFooter />
      </MemoryRouter>,
    );

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.length).toBeGreaterThan(10);
    expect(hrefs.filter((href) => !ROUTES.has(href))).toEqual([]);
  });

  it("groups links under labelled columns", () => {
    render(
      <MemoryRouter>
        <MarketingFooter />
      </MemoryRouter>,
    );

    for (const name of ["Product", "Resources", "Company"]) {
      expect(screen.getByRole("navigation", { name })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });
});
