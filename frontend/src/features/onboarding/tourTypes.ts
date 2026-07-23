export type TourStep = {
  id: string;
  element: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export type TourEndReason = "skip" | "done" | "destroy";

export type StartTourOptions = {
  steps?: TourStep[];
  fromIndex?: number;
  onSkip?: () => void;
  onComplete?: () => void;
};
