import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { renderWithStore } from "../test/utils";
import { MARKET_CATALOG } from "../features/markets/catalog";
import MarketingPage from "./MarketingPage";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}));

vi.mock("../features/marketing/useMarketingHeroMotion", () => ({
  useMarketingHeroMotion: () => undefined,
}));

vi.mock("../features/market/marketApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/market/marketApi")>();
  return {
    ...actual,
    useGetPricesQuery: () => ({
      data: {
        BTCUSDT: {
          price: "64000",
          change_pct_24h: 1.2,
          volume_24h: "1200000",
        },
        ETHUSDT: {
          price: "3200",
          change_pct_24h: -0.4,
          volume_24h: "800000",
        },
        SOLUSDT: {
          price: "140",
          change_pct_24h: 0.5,
          volume_24h: "400000",
        },
        SEIUSDT: {
          price: "0.42",
          change_pct_24h: 4.2,
          volume_24h: "90000",
        },
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

  it("shows marketing sections for signed-out visitors", () => {
    renderWithStore(
      <MemoryRouter>
        <MarketingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Learn to trade without risking real money/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Page sections" })).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Markets" }).some((l) => l.getAttribute("href") === "#markets"),
    ).toBe(true);
    expect(screen.getByRole("navigation", { name: "Market categories" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All markets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10x margin" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Bitcoin" })).toBeInTheDocument();
    const hero = document.querySelector("[data-mkt='hero']");
    expect(hero).not.toBeNull();
    expect(
      within(hero as HTMLElement).getByRole("heading", { level: 2, name: "Bitcoin" }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll("[data-mkt='featured']")).toHaveLength(1);
    expect(document.querySelector("[data-mkt='featured-scrubber']")).not.toBeNull();
    expect(
      screen.getByRole("slider", { name: "Featured market position" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Pioni paper trading desk")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "All markets" }),
    ).toBeInTheDocument();
    // The category breakdown only earns its space if it surfaces names the flat
    // grid above has not already shown.
    const names = (scope: string) =>
      [...document.querySelectorAll(`${scope} [data-mkt='market-name']`)].map(
        (el) => el.textContent,
      );
    const flat = names("[data-mkt='float-markets']");
    const grouped = names("[data-mkt='category-sections']");
    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped.filter((name) => flat.includes(name))).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Top movers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Spot desk" })).toBeInTheDocument();
    // Both hubs used to point at /trading, so the margin card silently opened spot.
    const hubs = [...document.querySelectorAll("[data-mkt='hub-card']")].map((el) => [
      el.querySelector("h3")?.textContent,
      el.getAttribute("href"),
    ]);
    expect(hubs).toEqual([
      ["Spot desk", "/trading"],
      ["Margin practice", "/trade/margin"],
    ]);
    // Every market link used to drop you on the default pair instead of the one
    // that was clicked, so each one has to name its own symbol.
    const marketLinks = [
      ...document.querySelectorAll(
        "[data-mkt='side-row'], [data-mkt='market-card'], [data-mkt='featured-card'], [data-mkt='browse-market'] a",
      ),
    ].map((el) => el.getAttribute("href") ?? "");
    expect(marketLinks.length).toBeGreaterThan(0);
    expect(marketLinks.every((href) => /^\/trading\?symbol=[A-Z]+$/.test(href))).toBe(true);
    for (const link of screen.getAllByRole("link", { name: "View all" })) {
      expect(link).toHaveAttribute("href", "/markets");
    }
    expect(screen.getByRole("link", { name: "Browse all" })).toHaveAttribute(
      "href",
      "/markets",
    );
    expect(
      screen.getByRole("navigation", { name: "How paper trading works" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Simulated funds only/i })).toHaveAttribute(
      "href",
      "/rules",
    );
    expect(screen.getAllByRole("link", { name: "Start paper trading" })[0]).toHaveAttribute(
      "href",
      "/sign-up",
    );
    expect(
      screen.getByRole("heading", { name: /A paper balance you can reset/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Everything stays in one desk/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "What you can trade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /What you can trade/i })).toHaveAttribute(
      "href",
      "#coverage",
    );
    expect(
      screen.getByRole("heading", { name: /Paper trading on your phone/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "App" }).some((l) => l.getAttribute("href") === "#app"),
    ).toBe(true);
    expect(
      screen.getByRole("img", { name: "Pioni trade ticket on mobile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "FAQ" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Ready to place your first paper trade/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Browse markets" })).toBeInTheDocument();
    // Every catalog entry has to be reachable from the index, not just the ones
    // the live feed happens to price.
    const browse = screen.getByRole("region", { name: "Browse markets" });
    expect(browse.querySelectorAll("[data-mkt='browse-market']")).toHaveLength(
      MARKET_CATALOG.length,
    );
    expect(browse.querySelectorAll("img[src^='/icons/assets/']")).toHaveLength(
      MARKET_CATALOG.length,
    );
  }, 40_000);

  it("filters the browse index to one category", async () => {
    const user = userEvent.setup();
    renderWithStore(
      <MemoryRouter>
        <MarketingPage />
      </MemoryRouter>,
    );

    const browse = screen.getByRole("region", { name: "Browse markets" });
    const filters = within(browse).getByRole("group", {
      name: "Filter markets by category",
    });
    await user.click(within(filters).getByRole("button", { name: "Layer 2" }));

    const expected = MARKET_CATALOG.filter((m) => m.category === "Layer 2").length;
    expect(browse.querySelectorAll("[data-mkt='browse-market']")).toHaveLength(expected);
    expect(
      within(filters).getByRole("button", { name: "Layer 2" }),
    ).toHaveAttribute("aria-pressed", "true");
  }, 40_000);
});
