import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import OrderTicket from "./OrderTicket";
import instrumentReducer from "../instrument/instrumentSlice";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: false }),
  useClerk: () => ({ openSignIn: vi.fn() }),
}));

vi.mock("../portfolio/portfolioApi", () => ({
  useGetMyPortfolioQuery: () => ({ data: undefined }),
  useGetMyPositionsQuery: () => ({ data: undefined }),
}));

vi.mock("./ordersApi", () => ({
  useSubmitOrderMutation: () => [vi.fn(), { isLoading: false }],
  useGetOrderBookQuery: () => ({ data: undefined }),
}));

vi.mock("../market/liveMarketStore", () => ({
  useLiveMarketTrade: () => null,
}));

function renderTicket(venue: "spot" | "margin") {
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

describe("OrderTicket spot venue", () => {
  it("matches spot chrome labels and controls", () => {
    renderTicket("spot");
    expect(screen.getByRole("tab", { name: "Buy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sell" })).toBeInTheDocument();
    expect(screen.getByLabelText("Enable margin")).toBeInTheDocument();
    expect(screen.getByLabelText("Margin 10x")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Limit" })).toBeInTheDocument();
    expect(screen.getByLabelText("Add funds")).toBeInTheDocument();
    expect(screen.getByLabelText("Order related balance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Your maker fee" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buy .+\/USD/ })).toBeInTheDocument();
  });
});

describe("OrderTicket margin venue", () => {
  it("shows Long/Short and margin chrome", () => {
    renderTicket("margin");
    expect(screen.getByRole("tab", { name: "Long" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Short" })).toBeInTheDocument();
    expect(screen.getByLabelText("Enable margin")).toBeInTheDocument();
    expect(screen.getByLabelText("Margin 10x")).toBeInTheDocument();
    expect(screen.getByLabelText("Reduce only")).toBeInTheDocument();
    expect(screen.getByLabelText("Reduce only")).toBeChecked();
    expect(screen.getByLabelText("TP/SL")).toBeDisabled();
    expect(screen.getByText("Required margin")).toBeInTheDocument();
    expect(screen.getByText("Margin health")).toBeInTheDocument();
    expect(screen.getByText("-%")).toBeInTheDocument();
    expect(screen.getByText("Available to trade")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Declare status" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Long \(buy\).+\/USD \(10x\)/ }),
    ).toBeInTheDocument();
  });
});
