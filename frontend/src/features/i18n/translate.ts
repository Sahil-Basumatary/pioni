import type { AppLanguage } from "../settings/regionalPrefs";
import {
  authMessage,
  type AuthMessageKey,
  AUTH_CATALOG,
} from "../auth/authCatalog";
import {
  shellMessage,
  type ShellMessageKey,
  SHELL_CATALOG,
} from "./shellCatalog";
import {
  statusShellMessage,
  type StatusShellMessageKey,
  STATUS_SHELL_CATALOG,
} from "./shellStatusCatalog";
import {
  tradeShellMessage,
  type TradeShellMessageKey,
  TRADE_SHELL_CATALOG,
} from "./shellTradeCatalog";
import {
  tradeChromeMessage,
  type TradeChromeMessageKey,
  TRADE_CHROME_CATALOG,
} from "./shellTradeChromeCatalog";

export type MessageKey =
  | AuthMessageKey
  | ShellMessageKey
  | StatusShellMessageKey
  | TradeShellMessageKey
  | TradeChromeMessageKey;

const AUTH_KEYS = new Set<string>(Object.keys(AUTH_CATALOG["en-US"]));
const SHELL_KEYS = new Set<string>(Object.keys(SHELL_CATALOG["en-US"]));
const STATUS_KEYS = new Set<string>(Object.keys(STATUS_SHELL_CATALOG["en-US"]));
const TRADE_KEYS = new Set<string>(Object.keys(TRADE_SHELL_CATALOG["en-US"]));
const TRADE_CHROME_KEYS = new Set<string>(
  Object.keys(TRADE_CHROME_CATALOG["en-US"]),
);

export function translate(
  language: AppLanguage,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  if (AUTH_KEYS.has(key)) {
    return authMessage(language, key as AuthMessageKey, vars);
  }
  if (SHELL_KEYS.has(key)) {
    return shellMessage(language, key as ShellMessageKey, vars);
  }
  if (STATUS_KEYS.has(key)) {
    return statusShellMessage(language, key as StatusShellMessageKey, vars);
  }
  if (TRADE_KEYS.has(key)) {
    return tradeShellMessage(language, key as TradeShellMessageKey, vars);
  }
  if (TRADE_CHROME_KEYS.has(key)) {
    return tradeChromeMessage(language, key as TradeChromeMessageKey, vars);
  }
  return String(key);
}

export type {
  ShellMessageKey,
  AuthMessageKey,
  StatusShellMessageKey,
  TradeShellMessageKey,
  TradeChromeMessageKey,
};
