import "driver.js/dist/driver.css";
import "./tour.css";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { driver, type Driver, type DriveStep } from "driver.js";
import { DEFAULT_TOUR_STEPS } from "./tourSteps";
import { mountTourStepDemo, unmountTourStepDemo } from "./mountTourDemo";
import type {
  StartTourOptions,
  TourEndReason,
  TourStep,
} from "./tourTypes";

type TourContextValue = {
  isActive: boolean;
  activeIndex: number | null;
  steps: TourStep[];
  startTour: (options?: StartTourOptions) => void;
  stopTour: (reason?: TourEndReason) => void;
  resumeTour: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

function toDriveSteps(steps: TourStep[]): DriveStep[] {
  return steps.map((step) => ({
    element: step.element,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
      align: step.align ?? "start",
      popoverClass: "pioni-tour-popover",
    },
  }));
}

function positionChartPopover(wrapper: HTMLElement, target: Element) {
  const pad = 12;
  const gap = 24;
  const slot = document.querySelector('[data-tour-slot="chart-card"]');
  const slotRect = slot?.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const popoverRect = wrapper.getBoundingClientRect();
  const maxTop = Math.max(pad, window.innerHeight - popoverRect.height - pad);
  const chartLeft = targetRect.left;
  // Keep the card fully left of the chart so it never covers what it explains.
  const preferredLeft = slotRect && slotRect.width > 40
    ? slotRect.left + 8
    : chartLeft - popoverRect.width - gap;
  const maxLeftForChart = chartLeft - popoverRect.width - gap;
  const maxLeft = Math.max(pad, Math.min(maxLeftForChart, window.innerWidth - popoverRect.width - pad));
  const top = Math.min(
    Math.max(
      (slotRect ?? targetRect).top +
        ((slotRect ?? targetRect).height - popoverRect.height) / 2,
      pad,
    ),
    maxTop,
  );
  const left = Math.min(Math.max(preferredLeft, pad), maxLeft);
  wrapper.style.top = `${top}px`;
  wrapper.style.left = `${left}px`;
  wrapper.style.right = "auto";
  wrapper.style.bottom = "auto";
  [...wrapper.classList]
    .filter((name) => name.startsWith("driver-popover-side-"))
    .forEach((name) => wrapper.classList.remove(name));
  wrapper.classList.add("driver-popover-side-left");
  const arrow = wrapper.querySelector(
    ".driver-popover-arrow",
  ) as HTMLElement | null;
  if (arrow) {
    [...arrow.classList]
      .filter((name) => name.startsWith("driver-popover-arrow-side-"))
      .forEach((name) => arrow.classList.remove(name));
    arrow.classList.add("driver-popover-arrow-side-left");
    arrow.style.top = `${Math.round(popoverRect.height / 2)}px`;
    arrow.style.left = "";
    arrow.style.right = "";
    arrow.style.transform = "translateY(-50%)";
  }
}

function settleTourPopover(
  activeDriver: Driver,
  wrapper: HTMLElement,
  step: TourStep | undefined,
) {
  activeDriver.refresh();
  requestAnimationFrame(() => {
    const target = activeDriver.getActiveElement();
    if (step?.id === "chart" && target) {
      positionChartPopover(wrapper, target);
    }
  });
}

function renderProgressDots(
  progressEl: HTMLElement,
  current: number,
  total: number,
) {
  progressEl.replaceChildren();
  progressEl.classList.add("pioni-tour-dots");
  progressEl.setAttribute("role", "status");
  progressEl.setAttribute("aria-label", `Step ${current} of ${total}`);
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("span");
    dot.className =
      i + 1 === current
        ? "pioni-tour-dot pioni-tour-dot-active"
        : "pioni-tour-dot";
    progressEl.appendChild(dot);
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<TourStep[]>(DEFAULT_TOUR_STEPS);
  const callbacksRef = useRef<Pick<StartTourOptions, "onSkip" | "onComplete">>(
    {},
  );
  const endingRef = useRef(false);
  const activeIndexRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [steps, setSteps] = useState<TourStep[]>(DEFAULT_TOUR_STEPS);

  const destroyDriver = useCallback(() => {
    const instance = driverRef.current;
    driverRef.current = null;
    unmountTourStepDemo();
    if (instance?.isActive()) instance.destroy();
    else if (instance) instance.destroy();
  }, []);

  const finish = useCallback(
    (reason: TourEndReason) => {
      if (endingRef.current) return;
      endingRef.current = true;
      setIsActive(false);
      setActiveIndex(null);
      activeIndexRef.current = null;
      destroyDriver();
      if (reason === "skip") callbacksRef.current.onSkip?.();
      if (reason === "done") callbacksRef.current.onComplete?.();
      endingRef.current = false;
    },
    [destroyDriver],
  );

  const stopTour = useCallback(
    (reason: TourEndReason = "destroy") => {
      finish(reason);
    },
    [finish],
  );

  const startTour = useCallback(
    (options?: StartTourOptions) => {
      destroyDriver();
      endingRef.current = false;
      const nextSteps = options?.steps?.length
        ? options.steps
        : DEFAULT_TOUR_STEPS;
      stepsRef.current = nextSteps;
      setSteps(nextSteps);
      callbacksRef.current = {
        onSkip: options?.onSkip,
        onComplete: options?.onComplete,
      };
      const total = nextSteps.length;
      const fromIndex = Math.max(0, Math.min(options?.fromIndex ?? 0, total - 1));

      const instance = driver({
        overlayColor: "#0a0a0a",
        overlayOpacity: 0.45,
        stagePadding: 8,
        stageRadius: 12,
        allowClose: true,
        animate: true,
        smoothScroll: true,
        allowKeyboardControl: true,
        skipMissingElement: true,
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        popoverClass: "pioni-tour-popover",
        showButtons: ["previous", "next", "close"],
        steps: toDriveSteps(nextSteps),
        onHighlighted: (_el, _step, { index, driver: activeDriver }) => {
          const idx = index ?? 0;
          activeIndexRef.current = idx;
          setActiveIndex(idx);
          setIsActive(true);
          const popover = activeDriver.getState("popover");
          if (popover?.wrapper) {
            settleTourPopover(
              activeDriver,
              popover.wrapper,
              stepsRef.current[idx],
            );
          }
        },
        onPopoverRender: (popover, { index, driver: activeDriver }) => {
          const stepList = stepsRef.current;
          const current = (index ?? 0) + 1;
          renderProgressDots(popover.progress, current, stepList.length);
          const step = stepList[index ?? 0];
          popover.wrapper.dataset.tourStep = step?.id ?? "";
          if (step) {
            let host = popover.wrapper.querySelector(
              ".pioni-tour-demo",
            ) as HTMLElement | null;
            if (!host) {
              host = document.createElement("div");
              host.className = "pioni-tour-demo";
              popover.wrapper.insertBefore(host, popover.title);
            }
            mountTourStepDemo(host, step.id);
          }
          let skip = popover.footer.querySelector(
            ".pioni-tour-skip",
          ) as HTMLButtonElement | null;
          if (!skip) {
            skip = document.createElement("button");
            skip.type = "button";
            skip.className = "pioni-tour-skip";
            skip.textContent = "Skip tour";
            skip.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              finish("skip");
            });
            popover.footer.insertBefore(skip, popover.footer.firstChild);
          }
          requestAnimationFrame(() => {
            settleTourPopover(activeDriver, popover.wrapper, step);
          });
        },
        onPrevClick: (_el, _step, { driver: d }) => {
          d.movePrevious();
        },
        onNextClick: (_el, _step, { driver: d, state }) => {
          const idx = state.activeIndex ?? 0;
          if (idx >= stepsRef.current.length - 1) {
            finish("done");
            return;
          }
          d.moveNext();
        },
        onCloseClick: () => {
          finish("skip");
        },
        onDestroyed: () => {
          if (endingRef.current) return;
          finish("skip");
        },
      });

      driverRef.current = instance;
      setIsActive(true);
      activeIndexRef.current = fromIndex;
      setActiveIndex(fromIndex);
      instance.drive(fromIndex);
    },
    [destroyDriver, finish],
  );

  const resumeTour = useCallback(() => {
    startTour({
      steps: stepsRef.current,
      fromIndex: 0,
      onSkip: callbacksRef.current.onSkip,
      onComplete: callbacksRef.current.onComplete,
    });
  }, [startTour]);

  useEffect(() => {
    return () => {
      endingRef.current = true;
      destroyDriver();
    };
  }, [destroyDriver]);

  const value = useMemo(
    () => ({
      isActive,
      activeIndex,
      steps,
      startTour,
      stopTour,
      resumeTour,
    }),
    [isActive, activeIndex, steps, startTour, stopTour, resumeTour],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}
