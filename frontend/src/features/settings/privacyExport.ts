import { LEGAL } from "../../pages/legal/legalConfig";
import type { DisplayPrefs } from "./displayPrefs";
import type { NotificationPrefs } from "./notificationPrefs";
import type { RegionalPrefs } from "./regionalPrefs";
import type { PaperApiKey } from "./apiKeysApi";

export type PrivacyExportAccount = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
};

export type PrivacyExportPayload = {
  exported_at: string;
  product: string;
  account: PrivacyExportAccount;
  portfolio: unknown;
  summary: unknown;
  positions: unknown;
  trades: unknown;
  onboarding: unknown;
  api_keys: Array<Omit<PaperApiKey, never>>;
  preferences: {
    display: DisplayPrefs;
    regional: RegionalPrefs;
    notifications: NotificationPrefs;
  };
};

export function buildPrivacyExport(input: {
  account: PrivacyExportAccount;
  portfolio: unknown;
  summary: unknown;
  positions: unknown;
  trades: unknown;
  onboarding: unknown;
  apiKeys: PaperApiKey[];
  display: DisplayPrefs;
  regional: RegionalPrefs;
  notifications: NotificationPrefs;
}): PrivacyExportPayload {
  return {
    exported_at: new Date().toISOString(),
    product: LEGAL.product,
    account: input.account,
    portfolio: input.portfolio,
    summary: input.summary,
    positions: input.positions,
    trades: input.trades,
    onboarding: input.onboarding,
    api_keys: input.apiKeys.map(({ id, name, key_prefix, can_query, can_trade, created_at, last_used_at }) => ({
      id,
      name,
      key_prefix,
      can_query,
      can_trade,
      created_at,
      last_used_at,
    })),
    preferences: {
      display: input.display,
      regional: input.regional,
      notifications: input.notifications,
    },
  };
}

export function downloadPrivacyExport(payload: PrivacyExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = payload.exported_at.slice(0, 10);
  a.href = url;
  a.download = `pioni-data-export-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
