import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { Interval } from "../../components/trading/CandlestickChart";

interface InstrumentState {
  symbol: string;
  interval: Interval;
}

const initialState: InstrumentState = {
  symbol: "BTCUSDT",
  interval: "1m",
};

const instrumentSlice = createSlice({
  name: "instrument",
  initialState,
  reducers: {
    symbolSelected(state, action: PayloadAction<string>) {
      state.symbol = action.payload.toUpperCase();
    },
    intervalChanged(state, action: PayloadAction<Interval>) {
      state.interval = action.payload;
    },
  },
});

export const { symbolSelected, intervalChanged } = instrumentSlice.actions;

export const selectSymbol = (state: RootState) => state.instrument.symbol;
export const selectInterval = (state: RootState) => state.instrument.interval;

export default instrumentSlice.reducer;
