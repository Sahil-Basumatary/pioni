import { describe, it, expect } from "vitest";
import { setupStore } from "../../app/store";
import reducer, {
  selectLatestTrade,
  selectMarketStatus,
  statusChanged,
  tradeReceived,
  tradesFrameReceived,
} from "./marketSlice";
import type { Trade } from "../../types/market";

const trade: Trade = {
  symbol: "BTCUSDT",
  exchange: "binance",
  price: "50000",
  quantity: "0.5",
  timestamp: 1_700_000_000,
  buyer_maker: false,
};

describe("marketSlice", () => {
  it("starts disconnected with no trades", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      status: "disconnected",
      latestTradeBySymbol: {},
    });
  });

  it("records the connection status", () => {
    const state = reducer(undefined, statusChanged("connected"));
    expect(state.status).toBe("connected");
  });

  it("keeps the latest trade keyed by symbol", () => {
    const next: Trade = { ...trade, price: "51000" };
    let state = reducer(undefined, tradeReceived(trade));
    state = reducer(state, tradeReceived(next));
    expect(state.latestTradeBySymbol.BTCUSDT).toEqual(next);
  });

  it("records the latest trade for each symbol in one frame", () => {
    const ethTrade: Trade = { ...trade, symbol: "ETHUSDT", price: "3000" };
    const nextBtcTrade: Trade = { ...trade, price: "52000" };
    const state = reducer(
      undefined,
      tradesFrameReceived({
        BTCUSDT: nextBtcTrade,
        ETHUSDT: ethTrade,
      }),
    );

    expect(state.latestTradeBySymbol.BTCUSDT).toEqual(nextBtcTrade);
    expect(state.latestTradeBySymbol.ETHUSDT).toEqual(ethTrade);
  });

  it("exposes status and trade through selectors", () => {
    const store = setupStore();
    store.dispatch(statusChanged("connected"));
    store.dispatch(tradesFrameReceived({ BTCUSDT: trade }));
    expect(selectMarketStatus(store.getState())).toBe("connected");
    expect(selectLatestTrade("BTCUSDT")(store.getState())).toEqual(trade);
    expect(selectLatestTrade("ETHUSDT")(store.getState())).toBeNull();
  });
});
