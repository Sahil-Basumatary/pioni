import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithStore } from "../../test/utils";
import SymbolSelector from "./SymbolSelector";

const PRICES = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    exchange: "binance",
    price: "50000",
    change_24h: null,
    change_pct_24h: null,
    high_24h: null,
    low_24h: null,
    volume_24h: null,
    updated_at: 1_700_000_000,
  },
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("SymbolSelector", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(PRICES)),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a button for every tradable symbol", () => {
    renderWithStore(<SymbolSelector selected="BTCUSDT" onSelect={() => {}} />);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("DOGE")).toBeInTheDocument();
  });

  it("reports the chosen symbol on click", async () => {
    const onSelect = vi.fn();
    renderWithStore(<SymbolSelector selected="BTCUSDT" onSelect={onSelect} />);
    await userEvent.click(screen.getByText("ETH"));
    expect(onSelect).toHaveBeenCalledWith("ETHUSDT");
  });

  it("renders the live price once the query resolves", async () => {
    renderWithStore(<SymbolSelector selected="BTCUSDT" onSelect={() => {}} />);
    expect(await screen.findByText(/\$50,000/)).toBeInTheDocument();
  });
});
