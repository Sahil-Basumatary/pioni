import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/features/i18n/packs");

const server = await createServer({
  configFile: false,
  root,
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { LANGUAGE_OPTIONS } = await server.ssrLoadModule(
    "/src/features/settings/regionalPrefs.ts",
  );
  const { AUTH_CATALOG } = await server.ssrLoadModule(
    "/src/features/auth/authCatalog.ts",
  );
  const { SHELL_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/shellCatalog.ts",
  );
  const { STATUS_SHELL_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/shellStatusCatalog.ts",
  );
  const { TRADE_SHELL_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/shellTradeCatalog.ts",
  );
  const { TRADE_CHROME_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/shellTradeChromeCatalog.ts",
  );
  const { GLOSSARY_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/glossaryCatalog.ts",
  );
  const { SETTINGS_CATALOG } = await server.ssrLoadModule(
    "/src/features/i18n/settingsCatalog.ts",
  );

  await mkdir(outDir, { recursive: true });
  for (const { value } of LANGUAGE_OPTIONS) {
    const pack = {
      auth: AUTH_CATALOG[value],
      shell: SHELL_CATALOG[value],
      status: STATUS_SHELL_CATALOG[value],
      trade: TRADE_SHELL_CATALOG[value],
      tradeChrome: TRADE_CHROME_CATALOG[value],
      glossary: GLOSSARY_CATALOG[value],
      settings: SETTINGS_CATALOG[value],
    };
    const body = `import type { LocalePack } from "../localePack";\n\nexport const pack: LocalePack = ${JSON.stringify(pack, null, 2)};\n`;
    await writeFile(join(outDir, `${value}.ts`), body);
  }
} finally {
  await server.close();
}
