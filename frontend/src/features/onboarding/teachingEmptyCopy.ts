import type { MessageKey } from "../i18n/translate";

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
  titleKey: MessageKey;
  bodyKey: MessageKey;
  actionLabelKey: MessageKey | null;
  action: TeachingAction;
};

export const TEACHING_EMPTY: Record<TeachingEmptyId, TeachingEmptyEntry> = {
  positions: {
    titleKey: "teachPositionsTitle",
    bodyKey: "teachPositionsBody",
    actionLabelKey: "teachStartTrading",
    action: "focus_ticket",
  },
  open_orders: {
    titleKey: "teachOpenOrdersTitle",
    bodyKey: "teachOpenOrdersBody",
    actionLabelKey: "teachStartTrading",
    action: "focus_ticket",
  },
  closed_orders: {
    titleKey: "teachClosedOrdersTitle",
    bodyKey: "teachClosedOrdersBody",
    actionLabelKey: "teachStartTrading",
    action: "focus_ticket",
  },
  trades: {
    titleKey: "teachTradesTitle",
    bodyKey: "teachTradesBody",
    actionLabelKey: "teachStartTrading",
    action: "focus_ticket",
  },
  home_positions: {
    titleKey: "teachHomePositionsTitle",
    bodyKey: "teachHomePositionsBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  home_orders: {
    titleKey: "teachHomeOrdersTitle",
    bodyKey: "teachHomeOrdersBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  history_trades: {
    titleKey: "teachHistoryTradesTitle",
    bodyKey: "teachHistoryTradesBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  history_orders: {
    titleKey: "teachHistoryOrdersTitle",
    bodyKey: "teachHistoryOrdersBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  history_ledger: {
    titleKey: "teachHistoryLedgerTitle",
    bodyKey: "teachHistoryLedgerBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  history_activity: {
    titleKey: "teachHistoryActivityTitle",
    bodyKey: "teachHistoryActivityBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  notifications_inbox: {
    titleKey: "teachNotificationsInboxTitle",
    bodyKey: "teachNotificationsInboxBody",
    actionLabelKey: "teachGoToTrade",
    action: "go_trade",
  },
  notifications_alerts: {
    titleKey: "teachNotificationsAlertsTitle",
    bodyKey: "teachNotificationsAlertsBody",
    actionLabelKey: null,
    action: null,
  },
};
