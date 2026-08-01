import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import OrderTicket from "./OrderTicket";
import instrumentReducer, {
  symbolSelected,
} from "../instrument/instrumentSlice";
import { LanguageProvider } from "../auth/LanguageProvider";

const auth = vi.hoisted(() => ({ isSignedIn: true }));
const submitOrder = vi.hoisted(() =>
  vi.fn(() => ({
    unwrap: () =>
      Promise.resolve({
        id: "ord-1",
        portfolio_id: "p1",
        symbol: "BTCUSDT",
        side: "BUY",
        order_type: "LIMIT",
        time_in_force: "GTC",
        status: "OPEN",
        quantity: "0.01",
        price: "50000",
        filled_quantity: "0",
        average_fill_price: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
  })),
);
const toast = vi.hoisted(() => vi.fn());

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: auth.isSignedIn }),
  useClerk: () => ({ openSignIn: vi.fn(), openSignUp: vi.fn() }),
}));

vi.mock("../portfolio/portfolioApi", () => ({
  useGetMyPortfolioQuery: () => ({ data: { cash_balance: "10000" } }),
  useGetMyPositionsQuery: () => ({ data: [] }),
}));

vi.mock("./ordersApi", () => ({
  useSubmitOrderMutation: () => [submitOrder, { isLoading: false }],
  useGetOrderBookQuery: () => ({
    data: {
      symbol: "BTCUSDT",
      best_bid: "49990",
      best_ask: "50010",
      bids: [],
      asks: [],
      spread: "20",
      timestamp: "2026-01-01T00:00:00Z",
    },
  }),
}));

vi.mock("../market/liveMarketStore", () => ({
  useLiveMarketTrade: () => ({
    symbol: "BTCUSDT",
    price: "50000",
    quantity: "0.1",
    side: "buy",
    timestamp: Date.now(),
  }),
}));

vi.mock("../toasts/useToast", () => ({
  useToast: () => toast,
}));

vi.mock("../toasts/orderWatch", () => ({
  watchOpenOrder: vi.fn(),
}));

function renderTicket() {
  auth.isSignedIn = true;
  const store = configureStore({
    reducer: { instrument: instrumentReducer },
  });
  store.dispatch(symbolSelected("BTCUSDT"));
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LanguageProvider>
          <OrderTicket venue="spot" />
        </LanguageProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe("OrderTicket submit money path", () => {
  beforeEach(() => {
    submitOrder.mockClear();
    toast.mockClear();
    localStorage.clear();
  });

  it("submits a limit buy with quantity and price", async () => {
    const user = userEvent.setup();
    renderTicket();

    await user.clear(screen.getByLabelText("Limit price USD"));
    await user.type(screen.getByLabelText("Limit price USD"), "50000");
    await user.clear(screen.getByLabelText("Quantity BTC"));
    await user.type(screen.getByLabelText("Quantity BTC"), "0.01");

    const submit = screen.getByRole("button", { name: /Buy BTC\/USD/ });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(submitOrder).toHaveBeenCalledWith({
      symbol: "BTCUSDT",
      side: "BUY",
      order_type: "LIMIT",
      time_in_force: "GTC",
      quantity: "0.01",
      price: "50000",
    });
    expect(toast).toHaveBeenCalled();
  });
});
