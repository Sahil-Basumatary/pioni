import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { setupStore, type AppStore, type RootState } from "../app/store";

interface RenderOptions {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export function renderWithStore(
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState) }: RenderOptions = {},
) {
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
}
