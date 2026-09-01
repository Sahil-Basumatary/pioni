import type { AuthMessageKey } from "../auth/authCatalog";
import type { LocalePack } from "./localePack";
import { interpolate } from "./interpolate";
import type { GlossaryMessageKey } from "./glossaryCatalog";
import type { SettingsMessageKey } from "./settingsCatalog";
import type { ShellMessageKey } from "./shellCatalog";
import type { StatusShellMessageKey } from "./shellStatusCatalog";
import type { TradeChromeMessageKey } from "./shellTradeChromeCatalog";
import type { TradeShellMessageKey } from "./shellTradeCatalog";
import type { MessageKey } from "./translate";

export function translateFromPack(
  pack: LocalePack,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  const name = key as string;
  if (name in pack.auth) {
    return interpolate(pack.auth[name as AuthMessageKey], vars);
  }
  if (name in pack.shell) {
    return interpolate(pack.shell[name as ShellMessageKey], vars);
  }
  if (name in pack.status) {
    return interpolate(pack.status[name as StatusShellMessageKey], vars);
  }
  if (name in pack.trade) {
    return interpolate(pack.trade[name as TradeShellMessageKey], vars);
  }
  if (name in pack.tradeChrome) {
    return interpolate(pack.tradeChrome[name as TradeChromeMessageKey], vars);
  }
  if (name in pack.glossary) {
    return interpolate(pack.glossary[name as GlossaryMessageKey], vars);
  }
  if (name in pack.settings) {
    return interpolate(pack.settings[name as SettingsMessageKey], vars);
  }
  return name;
}
