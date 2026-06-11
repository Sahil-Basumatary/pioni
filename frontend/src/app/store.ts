import { configureStore } from "@reduxjs/toolkit";
import instrumentReducer from "../features/instrument/instrumentSlice";

export const store = configureStore({
  reducer: {
    instrument: instrumentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
