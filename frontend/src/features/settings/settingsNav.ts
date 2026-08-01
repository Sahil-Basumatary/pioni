import type { SettingsMessageKey } from "../i18n/settingsCatalog";

export type SettingsSectionId =
  | "account"
  | "preferences"
  | "paper"
  | "notifications"
  | "limits"
  | "connections"
  | "privacy"
  | "shortcuts"
  | "activity";

export type SettingsNavGroupId = "account" | "trading" | "workspace";

export type SettingsNavItem = {
  id: SettingsSectionId;
  labelKey: SettingsMessageKey;
  descriptionKey: SettingsMessageKey;
  group: SettingsNavGroupId;
};

export const SETTINGS_NAV_GROUPS: {
  id: SettingsNavGroupId;
  labelKey: SettingsMessageKey;
}[] = [
  { id: "account", labelKey: "settingsGroupAccount" },
  { id: "trading", labelKey: "settingsGroupTrading" },
  { id: "workspace", labelKey: "settingsGroupWorkspace" },
];

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: "account",
    labelKey: "settingsNavAccount",
    descriptionKey: "settingsNavAccountDesc",
    group: "account",
  },
  {
    id: "preferences",
    labelKey: "settingsNavPreferences",
    descriptionKey: "settingsNavPreferencesDesc",
    group: "account",
  },
  {
    id: "notifications",
    labelKey: "settingsNavNotifications",
    descriptionKey: "settingsNavNotificationsDesc",
    group: "account",
  },
  {
    id: "privacy",
    labelKey: "settingsNavPrivacy",
    descriptionKey: "settingsNavPrivacyDesc",
    group: "account",
  },
  {
    id: "activity",
    labelKey: "settingsNavActivity",
    descriptionKey: "settingsNavActivityDesc",
    group: "account",
  },
  {
    id: "paper",
    labelKey: "settingsNavPaper",
    descriptionKey: "settingsNavPaperDesc",
    group: "trading",
  },
  {
    id: "limits",
    labelKey: "settingsNavLimits",
    descriptionKey: "settingsNavLimitsDesc",
    group: "trading",
  },
  {
    id: "connections",
    labelKey: "settingsNavConnections",
    descriptionKey: "settingsNavConnectionsDesc",
    group: "workspace",
  },
  {
    id: "shortcuts",
    labelKey: "settingsNavShortcuts",
    descriptionKey: "settingsNavShortcutsDesc",
    group: "workspace",
  },
];

export function isSettingsSection(value: string | undefined): value is SettingsSectionId {
  return SETTINGS_NAV.some((item) => item.id === value);
}
