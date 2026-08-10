import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloseSmallIcon } from "../../components/shell/shellIcons";
import { useToast } from "../toasts/useToast";
import {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
} from "./onboardingApi";
import { useTour } from "./TourProvider";
import WelcomeIllustration from "./WelcomeIllustration";
import "./welcome.css";

function isWelcomeRoute(pathname: string): boolean {
  return (
    pathname === "/home" ||
    pathname === "/trading" ||
    pathname === "/trade/margin" ||
    pathname === "/trade/futures"
  );
}

function isTradeRoute(pathname: string): boolean {
  return (
    pathname === "/trading" ||
    pathname === "/trade/margin" ||
    pathname === "/trade/futures"
  );
}

function wantsForceWelcome(): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get("welcome") === "1";
}

export default function WelcomeCard() {
  const { isSignedIn } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const titleId = useId();
  const descId = useId();
  const { startTour } = useTour();
  const { data, isSuccess, isError, isFetching } = useGetMyOnboardingQuery(
    undefined,
    {
      skip: !isSignedIn,
    },
  );
  const [patchOnboarding] = usePatchMyOnboardingMutation();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const forceWelcome = wantsForceWelcome();
  const errorWelcomeAllowed =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("pioni.welcome.skipped") !== "1";

  const flagsClear =
    Boolean(data) &&
    !data!.welcome_seen &&
    !data!.tour_completed &&
    !data!.tour_skipped;

  const eligible =
    Boolean(isSignedIn) &&
    isWelcomeRoute(pathname) &&
    !dismissed &&
    !isFetching &&
    (forceWelcome ||
      (isSuccess && flagsClear) ||
      (isError && errorWelcomeAllowed));

  useEffect(() => {
    if (!eligible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [eligible]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") !== "reset") return;
    let cancelled = false;
    void (async () => {
      try {
        await patchOnboarding({
          welcome_seen: false,
          tour_skipped: false,
          tour_completed: false,
          checklist_tour: false,
        }).unwrap();
      } catch {
        // ignore — user can retry
      }
      if (cancelled) return;
      params.delete("onboarding");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.location.replace(next || window.location.pathname);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, patchOnboarding]);

  const persist = useCallback(
    async (body: {
      welcome_seen?: boolean;
      tour_skipped?: boolean;
      tour_completed?: boolean;
      checklist_tour?: boolean;
    }) => {
      try {
        await patchOnboarding(body).unwrap();
      } catch {
        // Keep UI dismissed; retry on next session via server flags.
      }
    },
    [patchOnboarding],
  );

  const beginTour = useCallback(() => {
    startTour({
      onSkip: () => {
        void persist({ tour_skipped: true });
      },
      onComplete: () => {
        void persist({ tour_completed: true, checklist_tour: true });
        toast("Tour complete");
      },
    });
  }, [persist, startTour, toast]);

  const onSkip = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setDismissed(true);
    try {
      sessionStorage.setItem("pioni.welcome.skipped", "1");
    } catch {
      // ignore quota / private mode
    }
    await persist({ welcome_seen: true, tour_skipped: true });
    setBusy(false);
  }, [busy, persist]);

  const onStart = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setDismissed(true);
    await persist({ welcome_seen: true });
    if (!isTradeRoute(pathname)) {
      navigate("/trading");
      window.setTimeout(() => {
        beginTour();
        setBusy(false);
      }, 450);
      return;
    }
    beginTour();
    setBusy(false);
  }, [beginTour, busy, navigate, pathname, persist]);

  useEffect(() => {
    if (!eligible) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void onSkip();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [eligible, onSkip]);

  if (!eligible) return null;

  return createPortal(
    <div
      className="pioni-welcome-overlay fixed inset-0 z-[95] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Dismiss welcome"
        className="absolute inset-0 bg-[rgba(10,10,10,0.42)]"
        onClick={() => void onSkip()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="pioni-welcome-enter relative z-[1] w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => void onSkip()}
          className="rail-icon absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
        >
          <CloseSmallIcon className="h-4 w-4" />
        </button>
        <div className="border-b border-[var(--card-border)] bg-[#F5F5F5] px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
          <WelcomeIllustration className="h-auto w-full" />
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-2 pr-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Welcome to Pioni
            </p>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[22px]"
            >
              Paper trading with live market data
            </h2>
            <p
              id={descId}
              className="text-sm leading-relaxed text-[var(--text-muted)]"
            >
              Your account includes 100,000 USD in practice funds. Take a 2-minute tour?
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSkip()}
              className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)] disabled:opacity-60"
            >
              Skip tour
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onStart()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-soft)] disabled:opacity-60"
            >
              Start tour
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
