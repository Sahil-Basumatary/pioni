import { createApi } from "@reduxjs/toolkit/query/react";
import { gatewayBaseQuery } from "../../app/baseQuery";

export interface OnboardingState {
  id: string;
  user_id: string;
  welcome_seen: boolean;
  tour_completed: boolean;
  tour_skipped: boolean;
  checklist_tour: boolean;
  checklist_first_trade: boolean;
  checklist_view_position: boolean;
  checklist_sentiment: boolean;
  checklist_limit_order: boolean;
  tour_completed_at: string | null;
  tour_skipped_at: string | null;
  checklist_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OnboardingPatch = Partial<
  Pick<
    OnboardingState,
    | "welcome_seen"
    | "tour_completed"
    | "tour_skipped"
    | "checklist_tour"
    | "checklist_first_trade"
    | "checklist_view_position"
    | "checklist_sentiment"
    | "checklist_limit_order"
  >
>;

export const onboardingApi = createApi({
  reducerPath: "onboardingApi",
  baseQuery: gatewayBaseQuery(),
  tagTypes: ["Onboarding"],
  endpoints: (builder) => ({
    getMyOnboarding: builder.query<OnboardingState, void>({
      query: () => "/me/onboarding",
      providesTags: ["Onboarding"],
    }),
    patchMyOnboarding: builder.mutation<OnboardingState, OnboardingPatch>({
      query: (body) => ({
        url: "/me/onboarding",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Onboarding"],
    }),
  }),
});

export const {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
} = onboardingApi;
