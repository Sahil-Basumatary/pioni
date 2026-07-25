import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import instrumentReducer from "../features/instrument/instrumentSlice";
import marketReducer from "../features/market/marketSlice";
import toastReducer from "../features/toasts/toastSlice";
import { marketApi } from "../features/market/marketApi";
import { portfolioApi } from "../features/portfolio/portfolioApi";
import { ordersApi } from "../features/orders/ordersApi";
import { onboardingApi } from "../features/onboarding/onboardingApi";
import { apiKeysApi } from "../features/settings/apiKeysApi";
import { notificationPrefsApi } from "../features/settings/notificationPrefsApi";

const rootReducer = combineReducers({
  instrument: instrumentReducer,
  market: marketReducer,
  toasts: toastReducer,
  [marketApi.reducerPath]: marketApi.reducer,
  [portfolioApi.reducerPath]: portfolioApi.reducer,
  [ordersApi.reducerPath]: ordersApi.reducer,
  [onboardingApi.reducerPath]: onboardingApi.reducer,
  [apiKeysApi.reducerPath]: apiKeysApi.reducer,
  [notificationPrefsApi.reducerPath]: notificationPrefsApi.reducer,
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        marketApi.middleware,
        portfolioApi.middleware,
        ordersApi.middleware,
        onboardingApi.middleware,
        apiKeysApi.middleware,
        notificationPrefsApi.middleware,
      ),
    preloadedState,
  });
}

export const store = setupStore();

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
