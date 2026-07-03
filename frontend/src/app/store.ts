import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import instrumentReducer from "../features/instrument/instrumentSlice";
import marketReducer from "../features/market/marketSlice";
import { marketApi } from "../features/market/marketApi";
import { portfolioApi } from "../features/portfolio/portfolioApi";

const rootReducer = combineReducers({
  instrument: instrumentReducer,
  market: marketReducer,
  [marketApi.reducerPath]: marketApi.reducer,
  [portfolioApi.reducerPath]: portfolioApi.reducer,
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(marketApi.middleware, portfolioApi.middleware),
    preloadedState,
  });
}

export const store = setupStore();

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
