import { describe, expect, it } from "vitest";
import { LANGUAGE_OPTIONS } from "../settings/regionalPrefs";
import { SHELL_CATALOG, shellMessage } from "./shellCatalog";
import {
  STATUS_SHELL_CATALOG,
  statusShellMessage,
} from "./shellStatusCatalog";
import {
  TRADE_SHELL_CATALOG,
  tradeShellMessage,
} from "./shellTradeCatalog";
import {
  TRADE_CHROME_CATALOG,
  tradeChromeMessage,
} from "./shellTradeChromeCatalog";
import { translate } from "./translate";

describe("shell i18n catalog", () => {
  it("covers every AppLanguage", () => {
    for (const opt of LANGUAGE_OPTIONS) {
      expect(SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(shellMessage(opt.value, "navTrade")).toBeTruthy();
      expect(STATUS_SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(statusShellMessage(opt.value, "statusOnline")).toBeTruthy();
      expect(TRADE_SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(tradeShellMessage(opt.value, "tradeBuy")).toBeTruthy();
      expect(TRADE_CHROME_CATALOG[opt.value]).toBeTruthy();
      expect(tradeChromeMessage(opt.value, "tradePaneOrderForm")).toBeTruthy();
    }
  });

  it("translates shell keys through the shared lookup", () => {
    expect(translate("de-DE", "signIn")).toBe("Anmelden");
    expect(translate("zh-CN", "navMarkets")).toBe("市场");
    expect(translate("de-DE", "statusOnline")).toBe("Online");
    expect(translate("zh-CN", "notifications")).toBe("通知");
    expect(translate("de-DE", "retry")).toBe("Erneut versuchen");
    expect(translate("zh-CN", "createAlert")).toBe("创建提醒");
    expect(translate("de-DE", "tradeBuy")).toBe("Kaufen");
    expect(translate("zh-CN", "tradeBook")).toBe("盘口");
    expect(translate("de-DE", "tradePaneOrderForm")).toBe("Orderformular");
  });

  it("still resolves auth keys", () => {
    expect(translate("en-US", "signInTitle")).toContain("Pioni");
  });
});
