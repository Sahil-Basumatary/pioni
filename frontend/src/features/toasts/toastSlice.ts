import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type ToastTone = "positive" | "negative" | "neutral" | "warning" | "info";

export type ToastItem = {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
  createdAt: number;
  dedupeKey?: string;
  durationMs: number;
};

export type PushToastInput = {
  title: string;
  body?: string;
  tone?: ToastTone;
  dedupeKey?: string;
  durationMs?: number;
};

const MAX_STACK = 5;
const DEFAULT_DURATION_MS = 4200;

type ToastState = {
  items: ToastItem[];
};

const initialState: ToastState = { items: [] };

const toastSlice = createSlice({
  name: "toasts",
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        const next = action.payload;
        if (next.dedupeKey) {
          state.items = state.items.filter((t) => t.dedupeKey !== next.dedupeKey);
        }
        state.items.push(next);
        if (state.items.length > MAX_STACK) {
          state.items = state.items.slice(state.items.length - MAX_STACK);
        }
      },
      prepare(input: PushToastInput) {
        return {
          payload: {
            id: nanoid(),
            title: input.title,
            body: input.body,
            tone: input.tone ?? "neutral",
            createdAt: Date.now(),
            dedupeKey: input.dedupeKey,
            durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
          } satisfies ToastItem,
        };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.items = [];
    },
  },
});

export const { pushToast, dismissToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
