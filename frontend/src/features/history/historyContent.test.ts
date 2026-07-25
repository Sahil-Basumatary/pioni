import { describe, expect, it } from "vitest";
import type { PortfolioTrade } from "../portfolio/portfolioApi";
import {
  filtersForSection,
  ledgerFromTrades,
  sectionsForScope,
} from "./historyContent";

function trade(overrides: Partial<PortfolioTrade> = {}): PortfolioTrade {
  return {
    id: "t1",
    order_id: "o1",
    portfolio_id: "p1",
    symbol: "BTCUSD",
    side: "BUY",
    quantity: "0.5",
    price: "60000",
    fee: "0",
    executed_at: "2026-07-01T10:00:00Z",
    ...overrides,
  };
}

describe("ledgerFromTrades", () => {
  it("splits a buy into an asset credit and a cash debit", () => {
    const rows = ledgerFromTrades([trade()]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: "Trade buy",
      asset: "BTC",
      amount: "0.5 BTC",
    });
    expect(rows[1]).toMatchObject({
      type: "Trade buy",
      asset: "USD",
      amount: "−30000 USD",
    });
  });

  it("reverses both signs for a sell", () => {
    const rows = ledgerFromTrades([trade({ side: "SELL" })]);
    expect(rows[0].amount).toBe("−0.5 BTC");
    expect(rows[1].amount).toBe("30000 USD");
  });

  it("carries the fee on the cash leg only", () => {
    const rows = ledgerFromTrades([trade({ fee: "1.25" })]);
    expect(rows[0].fee).toBe("—");
    expect(rows[1].fee).toBe("1.25 USD");
  });

  it("gives every row a stable unique id so React keys do not collide", () => {
    const rows = ledgerFromTrades([trade({ id: "a" }), trade({ id: "b" })]);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it("returns nothing for an account with no fills", () => {
    expect(ledgerFromTrades([])).toEqual([]);
  });
});

describe("history sections", () => {
  it("offers the full set only on the main scope", () => {
    expect(sectionsForScope("main")).toEqual([
      "ledger",
      "orders",
      "trades",
      "positions",
    ]);
    expect(sectionsForScope("earn")).toEqual(["ledger"]);
    expect(sectionsForScope("otc")).toEqual(["ledger"]);
  });

  it("offers filters that the tables actually apply", () => {
    expect(filtersForSection("ledger")).toEqual(["Assets", "Types"]);
    expect(filtersForSection("orders")).toEqual(["Market", "Types"]);
    expect(filtersForSection("trades")).toEqual(["Market"]);
  });
});
