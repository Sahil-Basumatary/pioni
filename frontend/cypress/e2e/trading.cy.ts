/// <reference types="cypress" />

const SNAPSHOTS: Record<string, Record<string, unknown>> = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    exchange: "binance",
    price: "50000",
    change_24h: "1200",
    change_pct_24h: 2.46,
    high_24h: "51000",
    low_24h: "48500",
    volume_24h: "1250000000",
    updated_at: 1700000000,
  },
  ETHUSDT: {
    symbol: "ETHUSDT",
    exchange: "binance",
    price: "3200",
    change_24h: "-45",
    change_pct_24h: -1.39,
    high_24h: "3300",
    low_24h: "3150",
    volume_24h: "780000000",
    updated_at: 1700000000,
  },
};

describe("Trading page (stubbed market data)", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/market/prices", {
      fixture: "market-prices.json",
    }).as("prices");

    cy.intercept("GET", "**/market/prices/*", (req) => {
      const symbol =
        req.url.split("/").pop()?.split("?")[0]?.toUpperCase() ?? "BTCUSDT";
      req.reply(SNAPSHOTS[symbol] ?? SNAPSHOTS.BTCUSDT);
    }).as("snapshot");

    cy.intercept("GET", "**/market/klines/*", {
      statusCode: 200,
      body: { symbol: "BTCUSDT", interval: "1m", klines: [] },
    }).as("klines");

    cy.visit("/trading");
  });

  it("lists the tradable symbols with their latest prices", () => {
    cy.wait("@prices");
    cy.contains("button", "BTC").should("be.visible");
    cy.contains("button", "ETH").should("be.visible");
    cy.contains("button", "BTC").should("contain.text", "$50,000");
  });

  it("switches the active instrument when another symbol is clicked", () => {
    cy.contains("button", "BTC").should("have.class", "text-white");
    cy.contains("button", "ETH").click();
    cy.contains("button", "ETH").should("have.class", "text-white");
    cy.contains("button", "BTC").should("not.have.class", "text-white");
  });

  it("shows the 24h change for the selected instrument", () => {
    cy.wait("@snapshot");
    cy.contains("+2.46%").should("be.visible");
  });
});
