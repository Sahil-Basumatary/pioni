import { describe, expect, it } from "vitest";
import { buildPrivacyExport } from "./privacyExport";
import { DEFAULT_DISPLAY_PREFS } from "./displayPrefs";
import { DEFAULT_NOTIFICATION_PREFS } from "./notificationPrefs";
import { DEFAULT_REGIONAL_PREFS } from "./regionalPrefs";

describe("buildPrivacyExport", () => {
  it("builds a JSON-ready payload without inventing secrets", () => {
    const payload = buildPrivacyExport({
      account: {
        id: "user_1",
        username: "trader",
        email: "t@example.com",
        full_name: "Trader",
      },
      portfolio: { id: "p1" },
      summary: { cash: "100" },
      positions: [],
      trades: [],
      onboarding: { welcome_seen: true },
      apiKeys: [
        {
          id: "k1",
          name: "Bot",
          key_prefix: "pk_paper_abcd",
          can_query: true,
          can_trade: false,
          created_at: "2026-07-24T00:00:00Z",
          last_used_at: null,
        },
      ],
      display: DEFAULT_DISPLAY_PREFS,
      regional: DEFAULT_REGIONAL_PREFS,
      notifications: DEFAULT_NOTIFICATION_PREFS,
    });
    expect(payload.product).toBe("Pioni");
    expect(payload.account.username).toBe("trader");
    expect(payload.api_keys[0]?.key_prefix).toBe("pk_paper_abcd");
    expect(payload).not.toHaveProperty("api_key");
    expect(typeof payload.exported_at).toBe("string");
  });
});
