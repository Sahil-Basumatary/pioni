import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useListOrdersQuery } from "../orders/ordersApi";
import { useGetMyPositionsQuery } from "../portfolio/portfolioApi";
import {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
  type OnboardingPatch,
} from "./onboardingApi";

export function useChecklistAutoDetect() {
  const { isSignedIn } = useAuth();
  const { pathname } = useLocation();
  const { data: onboarding } = useGetMyOnboardingQuery(undefined, {
    skip: !isSignedIn,
  });
  const [patch] = usePatchMyOnboardingMutation();
  const patching = useRef(false);

  const { data: positions } = useGetMyPositionsQuery(
    { openOnly: true },
    { skip: !isSignedIn || Boolean(onboarding?.checklist_view_position) },
  );
  const { data: orders } = useListOrdersQuery(
    { limit: 50 },
    { skip: !isSignedIn || Boolean(onboarding?.checklist_limit_order) },
  );

  useEffect(() => {
    if (!isSignedIn || !onboarding || patching.current) return;
    const body: OnboardingPatch = {};
    if (!onboarding.checklist_tour && onboarding.tour_completed) {
      body.checklist_tour = true;
    }
    if (
      !onboarding.checklist_view_position &&
      positions?.some((p) => Number(p.quantity) !== 0)
    ) {
      body.checklist_view_position = true;
    }
    if (
      !onboarding.checklist_limit_order &&
      orders?.some((o) => o.order_type === "LIMIT")
    ) {
      body.checklist_limit_order = true;
    }
    if (!onboarding.checklist_sentiment && pathname.startsWith("/sentiment")) {
      body.checklist_sentiment = true;
    }
    if (Object.keys(body).length === 0) return;
    patching.current = true;
    void patch(body)
      .unwrap()
      .catch(() => {})
      .finally(() => {
        patching.current = false;
      });
  }, [
    isSignedIn,
    onboarding,
    positions,
    orders,
    pathname,
    patch,
  ]);
}
