export type SettingsSectionId =
  | "account"
  | "preferences"
  | "paper"
  | "notifications"
  | "limits";

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  description: string;
  group: "Account" | "Trading" | "Workspace";
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: "account",
    label: "Account",
    description: "Manage your profile, login information, and devices",
    group: "Account",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Choose how you want Pioni to look and behave",
    group: "Account",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Choose your notification preferences",
    group: "Account",
  },
  {
    id: "paper",
    label: "Paper trading",
    description: "Manage your paper balances and onboarding",
    group: "Trading",
  },
  {
    id: "limits",
    label: "Limits",
    description: "View your paper deposit and withdrawal limits",
    group: "Trading",
  },
];

export function isSettingsSection(value: string | undefined): value is SettingsSectionId {
  return SETTINGS_NAV.some((item) => item.id === value);
}
