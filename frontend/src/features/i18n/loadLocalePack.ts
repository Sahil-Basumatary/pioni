import type { AppLanguage } from "../settings/regionalPrefs";
import type { LocalePack } from "./localePack";
import { pack as enUS } from "./packs/en-US";

const localeModules = import.meta.glob<{ pack: LocalePack }>([
  "./packs/*.ts",
  "!./packs/en-US.ts",
]);

export { enUS };

export function loadLocalePack(language: AppLanguage): Promise<LocalePack> {
  if (language === "en-US") return Promise.resolve(enUS);
  const loader = localeModules[`./packs/${language}.ts`];
  if (!loader) return Promise.resolve(enUS);
  return loader().then((mod) => mod.pack);
}
