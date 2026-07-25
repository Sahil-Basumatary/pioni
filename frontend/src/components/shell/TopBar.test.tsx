import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar";

const openSignIn = vi.fn();
const openSignUp = vi.fn();

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useClerk: () => ({ openSignIn, openSignUp }),
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
  beforeEach(() => {
    openSignIn.mockClear();
    openSignUp.mockClear();
  });

  it("shows Sign in and Sign up when signed out, without avatar", () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /user/i })).not.toBeInTheDocument();
  });
});
