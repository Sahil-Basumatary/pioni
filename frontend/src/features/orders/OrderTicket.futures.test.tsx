import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import OrderTicket from "./OrderTicket";
import instrumentReducer from "../instrument/instrumentSlice";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: true }),
  useClerk: () => ({ openSignIn: vi.fn(), openSignUp: vi.fn() }),
}));

vi.mock("../portfolio/portfolioApi", () => ({
  useGetMyPortfolioQuery: () => ({ data: { cash_balance: "10000" } }),
  useGetMyPositionsQuery: () => ({ data: [] }),
}));

vi.mock("./ordersApi", () => ({
  useSubmitOrderMutation: () => [vi.fn(), { isLoading: false }],
  useGetOrderBookQuery: () => ({ data: undefined }),
}));

vi.mock("../market/liveMarketStore", () => ({
  useLiveMarketTrade: () => null,
}));

function renderTicket(venue: "spot" | "margin" | "futures") {
  const store = configureStore({
    reducer: { instrument: instrumentReducer },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <OrderTicket venue={venue} />
      </MemoryRouter>
    </Provider>,
  );
}

describe("OrderTicket futures venue", () => {
  it("shows futures chrome labels and controls", () => {
    renderTicket("futures");
    expect(screen.getByRole("tab", { name: "Long" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Short" })).toBeInTheDocument();
    expect(screen.getByLabelText("Cross 100x")).toBeInTheDocument();
    expect(screen.getByText("Unlock derivatives")).toBeInTheDocument();
    expect(screen.getByText("Trade spot instead")).toBeInTheDocument();
    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByLabelText("Reduce only")).toBeChecked();
    expect(screen.getByText("Required margin")).toBeInTheDocument();
    expect(screen.getByText("Est. liquidation")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Long \(buy\) BTC/ }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Enable margin")).not.toBeInTheDocument();
  });
});
