import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import StatusBar from "./StatusBar";
import marketReducer from "../../features/market/marketSlice";

vi.mock("../../features/market/liveMarketStore", () => ({
  useLiveMarketTrade: (symbol: string) =>
    symbol === "BTCUSDT"
      ? { symbol, price: "64000.5", quantity: "0.1", timestamp: 1, exchange: "binance", buyer_maker: false }
      : null,
}));

vi.mock("../../features/market/marketApi", () => ({
  useGetPricesQuery: () => ({
    data: {
      BTCUSDT: { change_pct_24h: -0.41 },
      ETHUSDT: { change_pct_24h: 1.2 },
    },
  }),
}));

function renderBar(status: "connected" | "connecting" | "disconnected") {
  const store = configureStore({
    reducer: { market: marketReducer },
    preloadedState: {
      market: { status, latestTradeBySymbol: {} },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <StatusBar />
      </MemoryRouter>
    </Provider>,
  );
}

describe("StatusBar", () => {
  it("shows Online with live BTC ticker when connected", () => {
    renderBar("connected");
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("BTC/USD")).toBeInTheDocument();
    expect(screen.getByText("$64,000.50")).toBeInTheDocument();
    expect(screen.getByText(/-0\.41%/)).toBeInTheDocument();
    expect(screen.getByText("Share feedback")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  it("shows Offline when the market socket is down", () => {
    renderBar("disconnected");
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
