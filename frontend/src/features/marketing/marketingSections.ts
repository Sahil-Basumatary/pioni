export const MARKETING_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "trade", label: "Trade" },
  { id: "markets", label: "Markets" },
  { id: "practice", label: "Practice" },
  { id: "desk", label: "Desk" },
  { id: "app", label: "App" },
  { id: "faq", label: "FAQ" },
] as const;

export const MARKETING_SECTION_IDS = MARKETING_SECTIONS.map((section) => section.id);
