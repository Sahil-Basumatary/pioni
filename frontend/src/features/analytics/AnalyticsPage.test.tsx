import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AnalyticsPage from "../../pages/AnalyticsPage";
import { renderWithStore } from "../../test/utils";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: false }),
}));

vi.mock("../../features/market/MarketSocketProvider", () => ({
  STATUS_BAR_SYMBOLS: ["BTCUSDT", "ETHUSDT"],
  useMarketSocket: () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    registerKlineHandler: () => () => {},
  }),
}));

vi.mock("../../features/markets/MarketSearchContext", () => ({
  useMarketSearch: () => ({
    favorites: [],
    toggleFav: vi.fn(),
    openSearch: vi.fn(),
  }),
}));

vi.mock("../../features/convert/ConvertContext", () => ({
  useConvert: () => ({ openConvert: vi.fn() }),
}));

vi.mock("../../features/trading/AlertCreateContext", () => ({
  useAlertCreate: () => ({ openCreateAlert: vi.fn() }),
}));

vi.mock("../../features/analytics/AnalyticsKlineWidget", () => ({
  default: () => <div>kline</div>,
}));

vi.mock("../../features/analytics/AnalyticsOrderBookWidget", () => ({
  default: () => <div>book</div>,
}));

describe("AnalyticsPage", () => {
  it("teaches what market analytics is beside the pair chrome", () => {
    renderWithStore(
      <MemoryRouter initialEntries={["/analytics/btcusdt"]}>
        <Routes>
          <Route path="/analytics/:pair" element={<AnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Market analytics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose a pair to view charts and market stats"),
    ).toBeInTheDocument();
  });
});
