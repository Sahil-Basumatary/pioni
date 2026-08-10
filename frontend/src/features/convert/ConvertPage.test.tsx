import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithStore } from "../../test/utils";
import { ConvertProvider } from "./ConvertContext";
import ConvertDialog from "./ConvertDialog";
import { quoteReceive } from "./convertQuote";

const isSignedIn = vi.hoisted(() => ({ current: true }));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: isSignedIn.current }),
  useClerk: () => ({ openSignIn: vi.fn(), openSignUp: vi.fn() }),
}));

vi.mock("../market/MarketSocketProvider", () => ({
  STATUS_BAR_SYMBOLS: ["BTCUSDT", "ETHUSDT"],
  useMarketSocket: () => ({ subscribe: vi.fn(), unsubscribe: vi.fn() }),
}));

function renderDialog() {
  window.history.replaceState(null, "", "/home#dialog/convert-asset/USD/BTC");
  return renderWithStore(
    <MemoryRouter>
      <ConvertProvider>
        <ConvertDialog />
      </ConvertProvider>
    </MemoryRouter>,
  );
}

describe("quoteReceive", () => {
  it("converts through the two USD legs", () => {
    expect(quoteReceive(645, 1, 64_500)).toBeCloseTo(0.01, 6);
  });

  it("refuses to quote when either leg has no live price", () => {
    expect(quoteReceive(645, 1, null)).toBeNull();
    expect(quoteReceive(645, null, 64_500)).toBeNull();
  });
});

describe("ConvertDialog", () => {
  it("renders convert chrome with review disabled until a priced amount is set", () => {
    isSignedIn.current = true;
    renderDialog();
    expect(screen.getByRole("heading", { name: "Convert" })).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeDisabled();
  });

  it("asks a signed-out visitor to sign in instead of showing a balance", () => {
    isSignedIn.current = false;
    renderDialog();
    expect(
      screen.getByText(/Sign in or create an account to continue/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
  });
});
