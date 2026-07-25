import { describe, expect, it } from "vitest";
import type {
  PortfolioLedgerEntry,
  PortfolioTrade,
} from "../portfolio/portfolioApi";
import {
  filtersForSection,
  ledgerFromTrades,
  rowsFromLedgerEntries,
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

function entry(
  overrides: Partial<PortfolioLedgerEntry> = {},
): PortfolioLedgerEntry {
  return {
    id: "l1",
    portfolio_id: "p1",
    trade_id: "t1",
    entry_type: "trade_buy",
    wallet: "Spot",
    asset: "Bitcoin",
    ticker: "BTC",
    amount: "0.5",
    fee: "0",
    balance_after: "0.5",
    executed_at: "2026-07-01T10:00:00Z",
    ...overrides,
  };
}

describe("rowsFromLedgerEntries", () => {
  it("formats balance_after into the Balance column", () => {
    const rows = rowsFromLedgerEntries([
      entry(),
      entry({
        id: "l2",
        asset: "US Dollar",
        ticker: "USD",
        amount: "-30000",
        fee: "1.25",
        balance_after: "69998.75",
      }),
    ]);
    expect(rows[0]).toMatchObject({
      type: "Trade buy",
      ticker: "BTC",
      amount: "0.5 BTC",
      fee: "—",
      balance: "0.5 BTC",
    });
    expect(rows[1]).toMatchObject({
      ticker: "USD",
      amount: "−30000 USD",
      fee: "1.25 USD",
      balance: "69998.75 USD",
    });
  });
});

describe("ledgerFromTrades", () => {
  it("splits a buy into an asset credit and a cash debit", () => {
    const rows = ledgerFromTrades([trade()]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: "Trade buy",
      asset: "Bitcoin",
      ticker: "BTC",
      amount: "0.5 BTC",
      balance: "—",
    });
    expect(rows[1]).toMatchObject({
      type: "Trade buy",
      asset: "US Dollar",
      ticker: "USD",
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
