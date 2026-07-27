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

export type MessageKey = AuthMessageKey | ShellMessageKey;

const AUTH_KEYS = new Set<string>(Object.keys(AUTH_CATALOG["en-US"]));
const SHELL_KEYS = new Set<string>(Object.keys(SHELL_CATALOG["en-US"]));

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
  return String(key);
}

export type { ShellMessageKey, AuthMessageKey };
