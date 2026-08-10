import type { TourStep } from "./tourTypes";

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "chart",
    element: '[data-tour="chart"]',
    title: "Chart and markets",
    description:
      "Watch live prices and switch markets from the header.",
    side: "left",
    align: "start",
  },
  {
    id: "balance",
    element: '[data-tour="balance"]',
    title: "Your paper balance",
    description: "This balance uses simulated funds.",
    side: "bottom",
    align: "end",
  },
  {
    id: "order-ticket",
    element: '[data-tour="order-ticket"]',
    title: "Place a paper order",
    description: "Place buy or sell orders here.",
    side: "left",
  },
  {
    id: "positions",
    element: '[data-tour="positions"]',
    title: "Positions and P&L",
    description:
      "Filled orders appear here with size and unrealized P&L.",
    side: "top",
  },
  {
    id: "sentiment",
    element: '[data-tour="sentiment-nav"]',
    title: "Sentiment",
    description: "Open sentiment data from the navigation.",
    side: "bottom",
  },
];
