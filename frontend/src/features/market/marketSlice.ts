import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { ConnectionStatus } from "../../hooks/useMarketWebSocket";
import type { Trade } from "../../types/market";

interface MarketState {
  status: ConnectionStatus;
  latestTradeBySymbol: Record<string, Trade>;
}

const initialState: MarketState = {
  status: "disconnected",
  latestTradeBySymbol: {},
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    statusChanged(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
    tradeReceived(state, action: PayloadAction<Trade>) {
      state.latestTradeBySymbol[action.payload.symbol] = action.payload;
    },
    tradesFrameReceived(state, action: PayloadAction<Record<string, Trade>>) {
      Object.assign(state.latestTradeBySymbol, action.payload);
    },
  },
});

export const { statusChanged, tradeReceived, tradesFrameReceived } = marketSlice.actions;

export const selectMarketStatus = (state: RootState) => state.market.status;
export const selectLatestTrade =
  (symbol: string) =>
  (state: RootState): Trade | null =>
    state.market.latestTradeBySymbol[symbol] ?? null;

export default marketSlice.reducer;
