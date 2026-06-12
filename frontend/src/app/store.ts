import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import instrumentReducer from "../features/instrument/instrumentSlice";
import { marketApi } from "../features/market/marketApi";

export const store = configureStore({
  reducer: {
    instrument: instrumentReducer,
    [marketApi.reducerPath]: marketApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
