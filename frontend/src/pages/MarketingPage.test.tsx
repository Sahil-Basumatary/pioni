import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithStore } from "../test/utils";
import MarketingPage from "./MarketingPage";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}));

vi.mock("../features/market/marketApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/market/marketApi")>();
  return {
    ...actual,
    useGetPricesQuery: () => ({
      data: {
        BTCUSDT: { price: "64000", change_pct_24h: "1.2" },
        ETHUSDT: { price: "3200", change_pct_24h: "-0.4" },
      },
    }),
  };
});

describe("MarketingPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("shows hero CTAs and full marketing body for signed-out visitors", () => {
    renderWithStore(
      <MemoryRouter>
        <MarketingPage />
      </MemoryRouter>,
    );

    const createLinks = screen.getAllByRole("link", { name: "Create account" });
    expect(createLinks.length).toBeGreaterThanOrEqual(1);
    expect(createLinks[0]).toHaveAttribute("href", "/sign-up");

    const explore = screen.getByRole("link", { name: "Explore paper trading" });
    expect(explore).toHaveAttribute("href", "/trading");

    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getAllByText(/Simulated funds only/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByAltText("Pioni paper trading desk")).toHaveAttribute(
      "src",
      "/marketing/hero.webp",
    );
    expect(screen.getByLabelText("Markets now")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Practice the desk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Built like a trading desk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Simulated funds\. Clear limits/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});
