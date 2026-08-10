import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ChecklistIcon,
  CloseIcon,
} from "../../components/shell/shellIcons";
import { useToast } from "../toasts/useToast";
import { useChecklistUi } from "./ChecklistContext";
import {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
  type OnboardingState,
} from "./onboardingApi";
import { useTour } from "./TourProvider";
import { useChecklistAutoDetect } from "./useChecklistAutoDetect";

type StepId =
  | "tour"
  | "first_trade"
  | "view_position"
  | "sentiment"
  | "limit_order";

const STEPS: {
  id: StepId;
  flag: keyof Pick<
    OnboardingState,
    | "checklist_tour"
    | "checklist_first_trade"
    | "checklist_view_position"
    | "checklist_sentiment"
    | "checklist_limit_order"
  >;
  title: string;
  hint: string;
  cta: string;
}[] = [
  {
    id: "tour",
    flag: "checklist_tour",
    title: "Take the tour",
    hint: "Chart, balance, order ticket, and positions.",
    cta: "Resume tour",
  },
  {
    id: "first_trade",
    flag: "checklist_first_trade",
    title: "Place your first paper trade",
    hint: "Use the order ticket on Trade.",
    cta: "Open Trade",
  },
  {
    id: "view_position",
    flag: "checklist_view_position",
    title: "Check a position and P&L",
    hint: "After a fill, open Positions under the chart.",
    cta: "View positions",
  },
  {
    id: "sentiment",
    flag: "checklist_sentiment",
    title: "Read a sentiment signal",
    hint: "Open a market signal on Sentiment.",
    cta: "Open Sentiment",
  },
  {
    id: "limit_order",
    flag: "checklist_limit_order",
    title: "Place a limit order",
    hint: "Set a price, then cancel the order or wait for a fill.",
    cta: "Try a limit",
  },
];

const EMPTY_FLAGS: Pick<
  OnboardingState,
  | "checklist_tour"
  | "checklist_first_trade"
  | "checklist_view_position"
  | "checklist_sentiment"
  | "checklist_limit_order"
> = {
  checklist_tour: false,
  checklist_first_trade: false,
  checklist_view_position: false,
  checklist_sentiment: false,
  checklist_limit_order: false,
};

export default function GettingStartedChecklist() {
  const { isSignedIn } = useAuth();
  const { open, setOpen, toggle } = useChecklistUi();
  const { data, isLoading, isError, refetch } = useGetMyOnboardingQuery(
    undefined,
    { skip: !isSignedIn },
  );
  const [patch] = usePatchMyOnboardingMutation();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const toast = useToast();
  useChecklistAutoDetect();

  if (!isSignedIn) return null;

  // Wait for /me/onboarding before painting — otherwise completed users flash 0/5 on refresh.
  const completed = Boolean(data?.checklist_completed_at);
  const knownIncomplete = Boolean(data && !data.checklist_completed_at);
  if (!open && (isLoading || !knownIncomplete)) return null;

  const flags = data ?? EMPTY_FLAGS;
  const doneCount = STEPS.filter((s) => flags[s.flag]).length;
  const progress = `${doneCount}/${STEPS.length}`;

  function runStep(id: StepId) {
    switch (id) {
      case "tour":
        startTour({
          onSkip: () => {
            void patch({ tour_skipped: true });
          },
          onComplete: () => {
            void patch({ tour_completed: true, checklist_tour: true });
            toast("Tour complete");
          },
        });
        setOpen(false);
        break;
      case "first_trade":
      case "limit_order":
      case "view_position":
        navigate("/trading");
        setOpen(false);
        break;
      case "sentiment":
        navigate("/sentiment");
        setOpen(false);
        break;
    }
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Dismiss checklist"
          className="rail-icon fixed inset-0 z-[59] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}
      {!open && knownIncomplete && (
        <button
          type="button"
          onClick={toggle}
          className="fixed bottom-16 left-3 z-[60] inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:bg-[#F5F5F5] sm:left-4"
        >
          <ChecklistIcon className="h-4 w-4" />
          Getting started
          <span className="rounded-md bg-[#ECECEF] px-1.5 py-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">
            {progress}
          </span>
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Getting started"
          className="fixed inset-y-2 right-11 z-[61] flex w-[min(360px,calc(100vw-3.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] md:right-12"
        >
          <div className="flex h-11 shrink-0 items-center justify-between px-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Getting started
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {isLoading
                  ? "Loading…"
                  : completed
                    ? "All done"
                    : `${progress} complete`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close checklist"
              onClick={() => setOpen(false)}
              className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          {isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              Loading checklist…
            </p>
          ) : isError && !data ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10">
              <p className="text-sm text-[var(--text-muted)]">
                Couldn’t load checklist progress.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
              >
                Retry
              </button>
            </div>
          ) : completed ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              Getting started complete.
            </p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
              {STEPS.map((step) => {
                const done = Boolean(flags[step.flag]);
                return (
                  <li key={step.id}>
                    <div
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                        done ? "bg-[#F7F7F8]" : "hover:bg-[#F5F5F5]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? "text-emerald-600"
                            : "text-[rgb(104,107,130)]"
                        }`}
                      >
                        {done ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-current" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            done
                              ? "text-[var(--text-muted)] line-through"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {step.hint}
                        </p>
                        {!done && (
                          <button
                            type="button"
                            onClick={() => runStep(step.id)}
                            className="mt-2 inline-flex h-7 items-center rounded-lg bg-[#ECECEF] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[#E2E2E6]"
                          >
                            {step.cta}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
