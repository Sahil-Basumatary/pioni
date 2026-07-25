import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import FavoritesRailPanel from "./FavoritesRailPanel";
import marketReducer from "../../features/market/marketSlice";
import instrumentReducer from "../../features/instrument/instrumentSlice";

const openSearch = vi.fn();
const toggleFav = vi.fn();
const onClose = vi.fn();

vi.mock("../../features/markets/MarketSearchContext", () => ({
  useMarketSearch: () => ({
    open: false,
    openSearch,
    closeSearch: () => {},
    favorites: ["BTCUSDT"],
    toggleFav,
  }),
}));

vi.mock("../../features/markets/useMarketRows", async () => {
  const actual = await vi.importActual<
    typeof import("../../features/markets/useMarketRows")
  >("../../features/markets/useMarketRows");
  return {
    ...actual,
    useMarketRows: () => ({
      rows: [
        {
          symbol: "BTCUSDT",
          label: "BTC",
          name: "Bitcoin",
          category: "Payment",
          marginLeverage: 10,
          price: 64000.5,
          changePct: -1.78,
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

function renderPanel() {
  const store = configureStore({
    reducer: {
      market: marketReducer,
      instrument: instrumentReducer,
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <FavoritesRailPanel onClose={onClose} />
      </MemoryRouter>
    </Provider>,
  );
}

describe("FavoritesRailPanel", () => {
  it("lists starred markets with price and change", () => {
    renderPanel();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(screen.getByText("64,000.5")).toBeTruthy();
    expect(screen.getByText("-1.78%")).toBeTruthy();
    expect(screen.queryByText("Ether")).toBeNull();
  });

  it("unfavorites from the star control", () => {
    renderPanel();
    fireEvent.click(
      screen.getByRole("button", { name: /Remove BTC from favorites/i }),
    );
    expect(toggleFav).toHaveBeenCalledWith("BTCUSDT");
  });
});
