import type { AuthMessages } from "../auth/authCatalog";
import type { GlossaryMessages } from "./glossaryCatalog";
import type { SettingsMessages } from "./settingsCatalog";
import type { ShellMessages } from "./shellCatalog";
import type { StatusShellMessages } from "./shellStatusCatalog";
import type { TradeChromeMessages } from "./shellTradeChromeCatalog";
import type { TradeShellMessages } from "./shellTradeCatalog";

export type LocalePack = {
  auth: AuthMessages;
  shell: ShellMessages;
  status: StatusShellMessages;
  trade: TradeShellMessages;
  tradeChrome: TradeChromeMessages;
  glossary: GlossaryMessages;
  settings: SettingsMessages;
};
