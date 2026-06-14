/// <reference types="cypress" />

// Requires the live stack: infra (postgres/redis/rabbitmq), gateway (:8000),
// market-data + orders services, and the Vite dev server (:5173).
const GATEWAY = "http://localhost:8000";

describe("Live stack smoke", () => {
  it("gateway reports healthy", () => {
    cy.request(`${GATEWAY}/health`).its("body").its("status").should("eq", "ok");
  });

  it("market data is reachable through the gateway", () => {
    cy.request(`${GATEWAY}/market/prices`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("object");
    });
  });

  it("the orders service serves an order book through the gateway", () => {
    cy.request(`${GATEWAY}/orderbook/BTCUSDT`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("object");
    });
  });

  it("order history queries resolve through the gateway", () => {
    cy.request({
      url: `${GATEWAY}/orders`,
      qs: { portfolio_id: "00000000-0000-0000-0000-000000000000" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 404]);
    });
  });

  it("the trading UI renders live market data and connects", () => {
    cy.visit("/trading");
    cy.contains("button", "BTC").should("be.visible");
    cy.contains("Live", { timeout: 15000 }).should("be.visible");
  });
});
