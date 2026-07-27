import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar";

const auth = vi.hoisted(() => ({ signedIn: false }));

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) =>
    auth.signedIn ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) =>
    auth.signedIn ? null : <>{children}</>,
}));

vi.mock("../../features/markets/MarketSearchContext", () => ({
  useMarketSearch: () => ({ openSearch: vi.fn() }),
}));

vi.mock("../../features/convert/ConvertContext", () => ({
  useConvert: () => ({ openConvert: vi.fn() }),
}));

vi.mock("../../features/settings/settingsContext", () => ({
  useSettings: () => ({ openSettings: vi.fn() }),
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
    auth.signedIn = false;
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

  it("offers no account settings entry point while signed out on compact", () => {
    auth.signedIn = false;
    render(
      <MemoryRouter>
        <TopBar compact />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: "Account settings" }),
    ).not.toBeInTheDocument();
  });

  it("sends signed-out logo clicks to Trade", () => {
    auth.signedIn = false;
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Pioni" })).toHaveAttribute(
      "href",
      "/trading",
    );
  });
});
