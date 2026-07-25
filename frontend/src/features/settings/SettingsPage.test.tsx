import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsDialog from "./SettingsDialog";
import { SettingsProvider, useSettings } from "./settingsContext";
import { readDisplayPrefs, writeDisplayPrefs } from "./displayPrefs";
import {
  readRegionalPrefs,
  writeRegionalPrefs,
  timezoneLabel,
} from "./regionalPrefs";
import { isSettingsSection } from "./settingsNav";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: true }),
  useUser: () => ({
    user: {
      id: "user_abc123def456ghi789",
      fullName: "Sahil Test",
      username: "sahil.test",
      passwordEnabled: true,
      totpEnabled: false,
      passkeys: [],
      emailAddresses: [
        { id: "em_1", emailAddress: "sahil@example.com" },
      ],
      primaryEmailAddress: { emailAddress: "sahil@example.com" },
      primaryEmailAddressId: "em_1",
      getSessions: async () => [],
      reload: async () => undefined,
      update: async () => undefined,
    },
  }),
  useSession: () => ({ session: { id: "sess_1" } }),
  useReverification: (fn: unknown) => fn,
  useClerk: () => ({
    openSignIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../toasts/useToast", () => ({
  useToast: () => vi.fn(),
}));

vi.mock("../onboarding/TourProvider", () => ({
  useTour: () => ({ startTour: vi.fn() }),
}));

vi.mock("../onboarding/onboardingApi", () => ({
  useGetMyOnboardingQuery: () => ({ data: undefined }),
  usePatchMyOnboardingMutation: () => [vi.fn()],
}));

vi.mock("../portfolio/portfolioApi", () => ({
  useResetPortfolioMutation: () => [vi.fn(), { isLoading: false }],
  useLazyGetMyPortfolioQuery: () => [vi.fn()],
  useLazyGetMySummaryQuery: () => [vi.fn()],
  useLazyGetMyTradesQuery: () => [vi.fn()],
  useLazyGetMyPositionsQuery: () => [vi.fn()],
}));

vi.mock("./apiKeysApi", () => ({
  useGetMyApiKeysQuery: () => ({ data: [], isLoading: false }),
  useCreateMyApiKeyMutation: () => [vi.fn(), { isLoading: false }],
  useRevokeMyApiKeyMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock("./notificationPrefsApi", () => ({
  fromServerPrefs: (row: {
    mode: string;
    toast_popups: boolean;
    email_enabled: boolean;
    browser_notifications: boolean;
    fills: boolean;
    partial_fills: boolean;
    cancellations: boolean;
    rejections: boolean;
    placements: boolean;
  }) => ({
    mode: row.mode,
    toastPopups: row.toast_popups,
    emailEnabled: row.email_enabled,
    browserNotifications: row.browser_notifications,
    fills: row.fills,
    partialFills: row.partial_fills,
    cancellations: row.cancellations,
    rejections: row.rejections,
    placements: row.placements,
  }),
  toServerPrefsPatch: (patch: Record<string, unknown>) => patch,
  useGetMyNotificationPrefsQuery: () => ({ data: undefined }),
  usePatchMyNotificationPrefsMutation: () => [
    vi.fn(() => ({ unwrap: async () => ({}) })),
  ],
}));

function OpenSettings({
  section = "account" as
    | "account"
    | "preferences"
    | "notifications"
    | "limits"
    | "paper"
    | "connections"
    | "privacy"
    | "shortcuts",
}) {
  const { openSettings } = useSettings();
  return (
    <button type="button" onClick={() => openSettings(section)}>
      Open
    </button>
  );
}

function renderDialog() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <OpenSettings />
        <SettingsDialog />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("settingsNav", () => {
  it("accepts known sections only", () => {
    expect(isSettingsSection("account")).toBe(true);
    expect(isSettingsSection("nope")).toBe(false);
  });
});

describe("displayPrefs", () => {
  it("round-trips confirmOrders and startPage", () => {
    writeDisplayPrefs({
      confirmOrders: true,
      showInfoTips: false,
      soundOnFill: true,
      startPage: "trading",
      defaultOrderType: "MARKET",
      priceDecimals: "4",
    });
    expect(readDisplayPrefs()).toEqual({
      confirmOrders: true,
      showInfoTips: false,
      soundOnFill: true,
      startPage: "trading",
      defaultOrderType: "MARKET",
      priceDecimals: "4",
    });
    writeDisplayPrefs({
      confirmOrders: false,
      showInfoTips: true,
      soundOnFill: false,
      startPage: "home",
      defaultOrderType: "LIMIT",
      priceDecimals: "auto",
    });
  });
});

describe("regionalPrefs", () => {
  it("round-trips timezone and number format", () => {
    writeRegionalPrefs({
      timezone: "Asia/Kolkata",
      currency: "USD",
      language: "en-US",
      numberFormat: "de-DE",
    });
    expect(readRegionalPrefs()).toEqual({
      timezone: "Asia/Kolkata",
      currency: "USD",
      language: "en-US",
      numberFormat: "de-DE",
    });
    expect(timezoneLabel("Asia/Kolkata")).toContain("Kolkata");
  });
});

describe("SettingsDialog", () => {
  it("opens settings modal with account details", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    expect(dialog).toBeTruthy();
    expect(dialog.className).toContain("max-w-[1512px]");
    expect(dialog.className).toContain("w-[90vw]");
    expect(dialog.className).toContain("h-[calc(100%-100px)]");
    expect(screen.getByRole("heading", { name: "Account" })).toBeTruthy();
    expect(screen.getByText("Account details")).toBeTruthy();
    expect(screen.getByText("Public ID")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(screen.getByText("Account security")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage emails" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change password" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Manage verification methods" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage passkeys" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete my account" })).toBeTruthy();
    expect(screen.getByText("Devices")).toBeTruthy();
    expect(screen.queryByText("Regional settings")).toBeNull();
    expect(screen.getByText("Trading platform")).toBeTruthy();
    expect(screen.getByText("Paper verified")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manage sign-in" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close account" })).toBeNull();
  });

  it("requires typing the sudo delete command before account deletion", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(screen.getByRole("dialog", { name: "Delete my account" })).toBeTruthy();
    expect(screen.getByText('sudo delete "sahil.test"')).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "Delete my account" });
    const confirmSubmit = buttons.find((btn) => btn.getAttribute("type") === "submit");
    expect(confirmSubmit).toBeTruthy();
    expect((confirmSubmit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Delete confirmation command"), {
      target: { value: 'sudo delete "sahil.test"' },
    });
    expect((confirmSubmit as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps timezone and number format only under preferences", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="preferences" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.queryByRole("combobox")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Time zone" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox", { name: "Time zone" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Kolkata/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Number format" })).toBeTruthy();
  });

  it("renders preferences section groups", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="preferences" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Trading" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Language & time" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Startup" })).toBeTruthy();
    expect(
      screen.getByRole("switch", { name: /Confirm before submitting orders/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Default order type" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Price decimals" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open on start" })).toBeTruthy();
  });

  it("renders notification preference controls", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="notifications" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Preference" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Channels" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trading updates" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /In-app toasts/i })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /^Email/i })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /Browser notifications/i })).toBeTruthy();
    expect(screen.queryByText("Coming soon")).toBeNull();
  });

  it("renders static paper funding limit cards", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="limits" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Limits" })).toBeTruthy();
    expect(
      screen.getByText(/Funding limits do not apply/i),
    ).toBeTruthy();
    expect(screen.getByText("Fiat deposits")).toBeTruthy();
    expect(screen.getByText("Fiat withdrawals")).toBeTruthy();
    expect(screen.getByText("Crypto deposits")).toBeTruthy();
    expect(screen.getByText("Crypto withdrawals")).toBeTruthy();
    expect(screen.getAllByText("Unlimited").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Not applicable").length).toBeGreaterThanOrEqual(2);
  });

  it("renders connections and api keys section chrome", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="connections" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Connections & API" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Connected apps" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "API keys" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create API key" })).toBeTruthy();
    expect(screen.getByText("No connected apps")).toBeTruthy();
  });

  it("renders privacy controls and data export", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="privacy" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Privacy" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open privacy policy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download data export" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to Account" })).toBeTruthy();
  });

  it("renders keyboard shortcuts reference", () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <OpenSettings section="shortcuts" />
          <SettingsDialog />
        </SettingsProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Keyboard shortcuts" })).toBeTruthy();
    expect(screen.getByText("Search markets")).toBeTruthy();
    expect(screen.getByText("Open keyboard shortcuts")).toBeTruthy();
    expect(screen.getByText("Close dialog or menu")).toBeTruthy();
  });
});
