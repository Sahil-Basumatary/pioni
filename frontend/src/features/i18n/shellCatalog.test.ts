import { describe, expect, it } from "vitest";
import { LANGUAGE_OPTIONS } from "../settings/regionalPrefs";
import { SHELL_CATALOG, shellMessage } from "./shellCatalog";
import { translate } from "./translate";

describe("shell i18n catalog", () => {
  it("covers every AppLanguage", () => {
    for (const opt of LANGUAGE_OPTIONS) {
      expect(SHELL_CATALOG[opt.value]).toBeTruthy();
      expect(shellMessage(opt.value, "navTrade")).toBeTruthy();
    }
  });

  it("translates shell keys through the shared lookup", () => {
    expect(translate("de-DE", "signIn")).toBe("Anmelden");
    expect(translate("zh-CN", "navMarkets")).toBe("市场");
  });

  it("still resolves auth keys", () => {
    expect(translate("en-US", "signInTitle")).toContain("Pioni");
  });
});
