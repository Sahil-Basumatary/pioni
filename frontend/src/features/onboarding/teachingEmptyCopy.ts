export type TeachingEmptyId =
  | "positions"
  | "open_orders"
  | "closed_orders"
  | "trades"
  | "home_positions"
  | "home_orders"
  | "history_trades"
  | "history_orders"
  | "history_ledger"
  | "history_activity"
  | "notifications_inbox"
  | "notifications_alerts";

export type TeachingAction = "focus_ticket" | "go_trade" | null;

export type TeachingEmptyEntry = {
  title: string;
  body: string;
  actionLabel: string | null;
  action: TeachingAction;
};

export const TEACHING_EMPTY: Record<TeachingEmptyId, TeachingEmptyEntry> = {
  positions: {
    title: "No open positions",
    body: "Filled buys show here with size and unrealized P&L. Place a paper market buy in the ticket.",
    actionLabel: "Start trading",
    action: "focus_ticket",
  },
  open_orders: {
    title: "No open orders",
    body: "Working limit orders will show here until they fill or you cancel. Try a limit buy slightly below the last price.",
    actionLabel: "Start trading",
    action: "focus_ticket",
  },
  closed_orders: {
    title: "No closed orders",
    body: "Filled, cancelled, and rejected orders archive here. Complete or cancel a working order to see one.",
    actionLabel: "Start trading",
    action: "focus_ticket",
  },
  trades: {
    title: "No trades yet",
    body: "Your first paper fill will appear here. Use the ticket above — simulated funds only.",
    actionLabel: "Start trading",
    action: "focus_ticket",
  },
  home_positions: {
    title: "No open positions yet",
    body: "Holdings from filled paper trades show up here. Open Trade and place a small market buy to get started.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  home_orders: {
    title: "No open orders",
    body: "Resting limit orders appear here until they fill. Place one from Trade now!",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  history_trades: {
    title: "No trades yet",
    body: "Your paper fills will list here with size and cost. Place a trade from Trade to populate this view.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  history_orders: {
    title: "No order history yet",
    body: "Submitted paper orders archive here after they fill or cancel. Start from the Trade ticket.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  history_ledger: {
    title: "No ledger activity",
    body: "Deposits, withdrawals, and balance changes show here. Trade or use Deposit/Convert to create activity.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  history_activity: {
    title: "No recent activity",
    body: "Fills and account moves show in this feed. Place a paper trade to see your first event.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  notifications_inbox: {
    title: "You are all caught up",
    body: "Paper fills and alerts will show up here. Place a trade and watch the fill show up in this inbox.",
    actionLabel: "Go to Trade",
    action: "go_trade",
  },
  notifications_alerts: {
    title: "No alerts yet",
    body: "Price alerts you create on Trade show here once they trigger. Create one from the Alerts tab.",
    actionLabel: null,
    action: null,
  },
};
