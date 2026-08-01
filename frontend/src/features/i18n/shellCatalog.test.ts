import { describe, expect, it } from "vitest";
import { LANGUAGE_OPTIONS } from "../settings/regionalPrefs";
import { SHELL_CATALOG, shellMessage } from "./shellCatalog";
import {
  STATUS_SHELL_CATALOG,
  statusShellMessage,
} from "./shellStatusCatalog";
import { translate } from "./translate";

describe("shell i18n catalog", () => {
  it("covers every AppLanguage", () => {
    for (const opt of LANGUAGE_OPTIONS) {
      expect(SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(shellMessage(opt.value, "navTrade")).toBeTruthy();
      expect(STATUS_SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(statusShellMessage(opt.value, "statusOnline")).toBeTruthy();
    }
  });

  it("translates shell keys through the shared lookup", () => {
    expect(translate("de-DE", "signIn")).toBe("Anmelden");
    expect(translate("zh-CN", "navMarkets")).toBe("市场");
    expect(translate("de-DE", "statusOnline")).toBe("Online");
    expect(translate("zh-CN", "notifications")).toBe("通知");
  });

  it("still resolves auth keys", () => {
    expect(translate("en-US", "signInTitle")).toContain("Pioni");
  });
});
