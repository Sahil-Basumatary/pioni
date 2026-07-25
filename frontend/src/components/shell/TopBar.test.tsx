import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar";

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: (_props: { children: React.ReactNode }) => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../features/markets/MarketSearchContext", () => ({
  useMarketSearch: () => ({ openSearch: vi.fn() }),
}));

vi.mock("../../features/convert/ConvertContext", () => ({
  useConvert: () => ({ openConvert: vi.fn() }),
}));

vi.mock("./BalanceChip", () => ({
  default: () => null,
}));

vi.mock("./LayoutsMenu", () => ({
  default: () => null,
}));

vi.mock("./ProductSwitcher", () => ({
  default: () => null,
}));

describe("TopBar auth chrome", () => {
  it("links to full-page Sign in and Sign up", () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });
});
