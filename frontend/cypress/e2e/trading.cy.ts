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

function stubMarketApis() {
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

  cy.intercept("GET", "**/orderbook/**", {
    statusCode: 200,
    body: {
      symbol: "BTCUSDT",
      bids: [],
      asks: [],
      best_bid: null,
      best_ask: null,
      spread: null,
      timestamp: new Date().toISOString(),
    },
  }).as("orderbook");
}

describe("Trade page (stubbed market data)", () => {
  beforeEach(() => {
    stubMarketApis();
    cy.visit("/trading");
  });

  it("renders pair header and order ticket chrome", () => {
    cy.get('[data-tour="pair-header"]').should("be.visible");
    cy.get('[aria-label="Select market"]').should("be.visible");
    cy.contains("BTC").should("be.visible");
    cy.get('[data-tour="order-ticket"]').within(() => {
      cy.get('[role="tab"]').contains("Buy").should("be.visible");
      cy.get('[role="tab"]').contains("Sell").should("be.visible");
      cy.get('[role="tab"]').contains("Limit").should("be.visible");
      cy.get('[role="tab"]').contains("Market").should("be.visible");
      cy.contains("a", "Sign up to trade").should("be.visible");
    });
  });

  it("shows 24h change from the stubbed snapshot", () => {
    cy.wait("@snapshot");
    cy.contains("+2.46%").should("be.visible");
  });

  it("switches the active instrument from the market search palette", () => {
    cy.get('[aria-label="Select market"]').click();
    cy.get('[role="dialog"][aria-label="Search for a market"]').should(
      "be.visible",
    );
    cy.get('[role="dialog"][aria-label="Search for a market"]').within(() => {
      cy.get('input[type="search"], input').first().clear().type("ETH");
      cy.contains("button", "ETH").click();
    });
    cy.get('[data-tour="pair-header"]').within(() => {
      cy.contains("ETH").should("be.visible");
      cy.contains("Ether").should("be.visible");
    });
  });

  it("stars the current pair into local favorites", () => {
    cy.get('[aria-label="Add to favorites"]').click();
    cy.get('[aria-label="Remove from favorites"]').should("be.visible");
    cy.window().then((win) => {
      const raw = win.localStorage.getItem("pioni.marketFavorites");
      expect(raw).to.be.a("string");
      const parsed = JSON.parse(raw as string) as string[];
      expect(parsed).to.include("BTCUSDT");
    });
  });
});
