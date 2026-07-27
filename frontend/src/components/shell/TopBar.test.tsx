import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar";
import { LanguageProvider } from "../../features/auth/LanguageProvider";

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

vi.mock("./ProductSwitcher", () => ({
  default: () => null,
}));

function renderTopBar(path = "/trading") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <TopBar />
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("TopBar auth chrome", () => {
  it("links to full-page Sign in and Sign up", () => {
    auth.signedIn = false;
    renderTopBar();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("shows language and app switcher while signed out", () => {
    auth.signedIn = false;
    renderTopBar();
    expect(screen.getByRole("button", { name: "Select language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "App switcher" })).toBeInTheDocument();
  });

  it("shows layouts on Trade and hides them elsewhere", () => {
    auth.signedIn = false;
    const { unmount } = renderTopBar("/trading");
    expect(screen.getByRole("button", { name: "Layouts" })).toBeInTheDocument();
    unmount();
    renderTopBar("/markets");
    expect(screen.queryByRole("button", { name: "Layouts" })).not.toBeInTheDocument();
  });

  it("offers no account settings entry point while signed out on compact", () => {
    auth.signedIn = false;
    render(
      <LanguageProvider>
        <MemoryRouter>
          <TopBar compact />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "Account settings" }),
    ).not.toBeInTheDocument();
  });

  it("sends signed-out logo clicks to Trade", () => {
    auth.signedIn = false;
    renderTopBar();
    expect(screen.getByRole("link", { name: "Pioni" })).toHaveAttribute(
      "href",
      "/trading",
    );
  });

  it("shows deposit and convert while signed in", () => {
    auth.signedIn = true;
    renderTopBar();
    expect(screen.getByRole("link", { name: /Deposit/i })).toHaveAttribute(
      "href",
      "/deposit",
    );
    expect(screen.getByRole("button", { name: /Convert/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "App switcher" })).toBeInTheDocument();
  });
});
