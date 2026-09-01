import { describe, expect, it } from "vitest";
import { AUTH_CATALOG } from "../auth/authCatalog";
import { GLOSSARY_CATALOG } from "./glossaryCatalog";
import { loadLocalePack } from "./loadLocalePack";
import { SETTINGS_CATALOG } from "./settingsCatalog";
import { SHELL_CATALOG } from "./shellCatalog";
import { STATUS_SHELL_CATALOG } from "./shellStatusCatalog";
import { TRADE_CHROME_CATALOG } from "./shellTradeChromeCatalog";
import { TRADE_SHELL_CATALOG } from "./shellTradeCatalog";
import { translateFromPack } from "./translateFromPack";
import { LANGUAGE_OPTIONS } from "../settings/regionalPrefs";

describe("locale packs", () => {
  it("matches the catalog modules for every language", async () => {
    for (const { value } of LANGUAGE_OPTIONS) {
      const pack = await loadLocalePack(value);
      expect(pack.auth).toEqual(AUTH_CATALOG[value]);
      expect(pack.shell).toEqual(SHELL_CATALOG[value]);
      expect(pack.status).toEqual(STATUS_SHELL_CATALOG[value]);
      expect(pack.trade).toEqual(TRADE_SHELL_CATALOG[value]);
      expect(pack.tradeChrome).toEqual(TRADE_CHROME_CATALOG[value]);
      expect(pack.glossary).toEqual(GLOSSARY_CATALOG[value]);
      expect(pack.settings).toEqual(SETTINGS_CATALOG[value]);
    }
  });

  it("interpolates from the loaded pack", async () => {
    const pack = await loadLocalePack("en-US");
    expect(
      translateFromPack(pack, "forgotPasswordOrUsername", {
        password: "password",
        username: "username",
      }),
    ).toBe("Forgot password or username?");
    const de = await loadLocalePack("de-DE");
    expect(translateFromPack(de, "signIn")).toBe("Anmelden");
  });
});
