import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import StatusBar from "./StatusBar";
import { LanguageProvider } from "../../features/auth/LanguageProvider";
import marketReducer from "../../features/market/marketSlice";
import instrumentReducer from "../../features/instrument/instrumentSlice";

vi.mock("../../features/market/liveMarketStore", () => ({
  useLiveMarketTrade: (symbol: string) =>
    symbol === "BTCUSDT"
      ? { symbol, price: "64000.5", quantity: "0.1", timestamp: 1, exchange: "binance", buyer_maker: false }
      : null,
}));

vi.mock("../../features/markets/MarketSearchContext", () => ({
  useMarketSearch: () => ({
    open: false,
    openSearch: () => {},
    closeSearch: () => {},
    favorites: ["BTCUSDT", "ETHUSDT"],
    toggleFav: () => {},
  }),
}));

vi.mock("../../features/markets/useMarketRows", async () => {
  const actual = await vi.importActual<typeof import("../../features/markets/useMarketRows")>(
    "../../features/markets/useMarketRows",
  );
  return {
    ...actual,
    useMarketRows: () => ({
      rows: [
        {
          symbol: "BTCUSDT",
          label: "BTC",
          name: "Bitcoin",
          category: "Payment",
          price: 64000.5,
          changePct: -0.41,
          high: null,
          low: null,
          volume: 1000,
        },
        {
          symbol: "ETHUSDT",
          label: "ETH",
          name: "Ether",
          category: "Layer 1",
          price: 3200,
          changePct: 1.2,
          high: null,
          low: null,
          volume: 800,
        },
      ],
      isLoading: false,
      isError: false,
    }),
  };
});

function renderBar(status: "connected" | "connecting" | "disconnected") {
  const store = configureStore({
    reducer: { market: marketReducer, instrument: instrumentReducer },
    preloadedState: {
      market: { status, latestTradeBySymbol: {} },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LanguageProvider>
          <StatusBar />
        </LanguageProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe("StatusBar", () => {
  it("shows Online and Favorites chip with favorited tickers", () => {
    renderBar("connected");
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Favorites" })).toBeInTheDocument();
    expect(screen.getByText("BTC/USD")).toBeInTheDocument();
    expect(screen.getByText("$64,000.50")).toBeInTheDocument();
    expect(screen.getByText("Share feedback")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  it("opens ticker type menu and switches to Gainers", async () => {
    const user = userEvent.setup();
    renderBar("connected");
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    expect(screen.getByText("Ticker type")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Gainers/i }));
    expect(screen.getByRole("button", { name: "Gainers" })).toBeInTheDocument();
  });

  it("shows Offline when the market socket is down", () => {
    renderBar("disconnected");
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
