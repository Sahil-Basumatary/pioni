import type { TourStep } from "./tourTypes";

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "chart",
    element: '[data-tour="chart"]',
    title: "Live chart & symbols",
    description:
      "Watch prices update in real time. Switch pairs anytime from the header.",
    side: "left",
    align: "start",
  },
  {
    id: "balance",
    element: '[data-tour="balance"]',
    title: "Your paper balance",
    description:
      "This is practice money — trade freely without risking anything real.",
    side: "bottom",
    align: "end",
  },
  {
    id: "order-ticket",
    element: '[data-tour="order-ticket"]',
    title: "Place a paper order",
    description:
      "Buy or sell here. It's practice money — you can't lose anything real.",
    side: "left",
  },
  {
    id: "positions",
    element: '[data-tour="positions"]',
    title: "Positions & P&L",
    description:
      "After a fill, your holdings and profit/loss show up in this panel.",
    side: "top",
  },
  {
    id: "sentiment",
    element: '[data-tour="sentiment-nav"]',
    title: "Sentiment signals",
    description:
      "Read market mood here anytime. Check the getting-started checklist too.",
    side: "bottom",
  },
];
