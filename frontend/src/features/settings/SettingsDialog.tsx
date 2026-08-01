import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import {
  BellIcon,
  BookIcon,
  ChecklistIcon,
  CloseSmallIcon,
  CoinsIcon,
  DepositIcon,
  QuestionMarkCircleIcon,
  SettingsSliderHorizontalIcon,
  Transfer2Icon,
  UserIcon,
  WithdrawIcon,
} from "../../components/shell/shellIcons";
import { useResetPortfolioMutation } from "../portfolio/portfolioApi";
import {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
} from "../onboarding/onboardingApi";
import { useTour } from "../onboarding/TourProvider";
import { useToast } from "../toasts/useToast";
import { SIGN_IN_PATH } from "../auth/authRoutes";
import {
  DEFAULT_DISPLAY_PREFS,
  DEFAULT_ORDER_TYPE_OPTIONS,
  PRICE_DECIMALS_OPTIONS,
  START_PAGE_OPTIONS,
  THEME_OPTIONS,
  readDisplayPrefs,
  writeDisplayPrefs,
  type DisplayPrefs,
} from "./displayPrefs";
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFY_MODE_OPTIONS,
  browserNotificationPermission,
  readNotificationPrefs,
  requestBrowserNotificationPermission,
  writeNotificationPrefs,
  type NotificationPrefs,
  type NotifyMode,
} from "./notificationPrefs";
import {
  fromServerPrefs,
  toServerPrefsPatch,
  useGetMyNotificationPrefsQuery,
  usePatchMyNotificationPrefsMutation,
} from "./notificationPrefsApi";
import { PAPER_LIMIT_CARDS } from "./paperLimits";
import { useLanguage } from "../auth/LanguageProvider";
import {
  LANGUAGE_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  readRegionalPrefs,
  writeRegionalPrefs,
  type RegionalPrefs,
} from "./regionalPrefs";
import AccountSecurity from "./AccountSecurity";
import ActivitySection from "./ActivitySection";
import ConnectionsSection from "./ConnectionsSection";
import PrivacySection from "./PrivacySection";
import ShortcutsSection from "./ShortcutsSection";
import SettingsSelect from "./SettingsSelect";
import { useSettings } from "./settingsContext";
import { SETTINGS_NAV, SETTINGS_NAV_GROUPS, type SettingsSectionId } from "./settingsNav";

function navIcon(id: SettingsSectionId) {
  switch (id) {
    case "preferences":
      return SettingsSliderHorizontalIcon;
    case "notifications":
      return BellIcon;
    case "limits":
      return CoinsIcon;
    case "paper":
      return DepositIcon;
    case "connections":
      return Transfer2Icon;
    case "privacy":
      return BookIcon;
    case "activity":
      return ChecklistIcon;
    case "shortcuts":
      return QuestionMarkCircleIcon;
    default:
      return UserIcon;
  }
}

export default function SettingsDialog() {
  const { open, section, setSection, closeSettings } = useSettings();
  const { t } = useLanguage();
  const { user } = useUser();
  const active = SETTINGS_NAV.find((item) => item.id === section) ?? SETTINGS_NAV[0];
  const accountLabel =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    t("settingsAccountFallback");

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center">
      <button
        type="button"
        aria-label={t("settingsDismiss")}
        className="absolute inset-0 bg-[rgba(15,15,15,0.6)]"
        onClick={closeSettings}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("settingsTitle")}
        className="relative z-[1] flex h-[calc(100%-100px)] max-h-full w-[90vw] max-w-[1512px] overflow-hidden rounded-[12px] bg-white shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14),0_0_0_1px_rgba(42,28,0,0.07)]"
      >
        <aside
          aria-label={t("settingsSections")}
          className="flex w-[240px] shrink-0 flex-col overflow-y-auto bg-[#F9F8F7] px-2 py-2"
        >
          <nav className="flex flex-col gap-0.5">
            {SETTINGS_NAV_GROUPS.map((group) => {
              const items = SETTINGS_NAV.filter((item) => item.group === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id} className="min-w-0">
                  <p className="px-2 py-1.5 text-xs font-medium text-[#A19E99]">
                    {t(group.labelKey)}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const selected = item.id === section;
                      const Icon = navIcon(item.id);
                      const label =
                        item.id === "account" ? accountLabel : t(item.labelKey);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSection(item.id)}
                          className={`flex h-7 items-center gap-2 rounded-[6px] px-1.5 text-left text-[14px] leading-none text-[#2C2C2B] ${
                            selected
                              ? "bg-[rgba(42,28,0,0.07)]"
                              : "hover:bg-[rgba(42,28,0,0.045)]"
                          }`}
                        >
                          {item.id === "account" ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/[0.08] text-[#6B6B6B]">
                              <UserIcon className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <Icon className="h-4 w-4 shrink-0 text-[#6B6B6B]" />
                          )}
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
        <section className="relative flex min-w-0 flex-1 flex-col bg-white">
          <button
            type="button"
            aria-label={t("settingsClose")}
            onClick={closeSettings}
            className="absolute right-3 top-3 z-[2] flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.07)]"
          >
            <CloseSmallIcon className="h-3.5 w-3.5" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto px-[60px] py-9">
            <header className="mb-6 pr-8">
              <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-[#2C2C2B]">
                {t(active.labelKey)}
              </h2>
              <p className="mt-1 text-sm text-[#787774]">{t(active.descriptionKey)}</p>
            </header>
            {section === "account" && <AccountSection />}
            {section === "preferences" && <PreferencesSection />}
            {section === "paper" && <PaperSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "limits" && <LimitsSection />}
            {section === "connections" && <ConnectionsSection />}
            {section === "privacy" && <PrivacySection />}
            {section === "activity" && <ActivitySection />}
            {section === "shortcuts" && <ShortcutsSection />}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}

function formatPublicId(userId: string): string {
  const raw = userId.replace(/^user_/, "").toUpperCase();
  const chunks = raw.match(/.{1,4}/g) ?? [raw];
  return chunks.slice(0, 4).join(" ");
}

function AccountSection() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const { closeSettings } = useSettings();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const name =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    t("settingsPaperTrader");
  const username = user?.username || user?.id?.slice(0, 18) || "—";
  const publicId = user?.id ? formatPublicId(user.id) : "—";

  async function copyPublicId() {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(publicId);
      toast(t("settingsPublicIdCopied"));
    } catch {
      toast(t("settingsCouldntCopyPublicId"));
    }
  }

  async function savePreferredName() {
    if (!user || !nameDraft.trim()) return;
    const parts = nameDraft.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");
    try {
      await user.update({ firstName, lastName });
      setEditingName(false);
      toast(t("settingsPreferredNameSaved"));
    } catch {
      toast(t("settingsCouldntUpdateName"));
    }
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-[#787774]">
          {t("settingsSignInToManage")}
        </p>
        <button
          type="button"
          onClick={() => {
            closeSettings();
            navigate(SIGN_IN_PATH);
          }}
          className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          {t("signIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          {t("settingsProfile")}
        </h3>
        <div className="mt-4 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[#6B6B6B]">
            <UserIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#787774]">
              {t("settingsPreferredName")}
            </p>
            {editingName ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="h-8 min-w-[200px] flex-1 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
                />
                <button
                  type="button"
                  onClick={() => void savePreferredName()}
                  className="h-7 rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B]"
                >
                  {t("settingsSave")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="h-7 rounded-[6px] px-2 text-sm font-medium text-[#787774]"
                >
                  {t("tradeCancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name);
                  setEditingName(true);
                }}
                className="mt-1 block w-full rounded-[6px] border border-transparent px-0 py-1 text-left text-sm font-medium text-[#2C2C2B] hover:border-[rgba(42,28,0,0.12)] hover:bg-white hover:px-2"
              >
                {name}
              </button>
            )}
            <p className="mt-1 text-xs text-[#787774]">
              {t("settingsPaperOnlyBlurb")}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          {t("settingsAccountDetails")}
        </h3>
        <div className="mt-4 flex flex-col gap-5">
          <DetailRow label={t("settingsUsername")} value={username} />
          <DetailRow
            label={t("settingsPublicId")}
            value={publicId}
            mono
            hint={t("settingsPublicIdHint")}
            action={
              <button
                type="button"
                onClick={() => void copyPublicId()}
                className="inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
              >
                {t("settingsCopy")}
              </button>
            }
          />
          <DetailRow
            label={t("settingsVerification")}
            value={t("settingsPaperVerified")}
            hint={t("settingsPaperVerifiedHint")}
          />
        </div>
      </div>

      <AccountSecurity />

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          {t("settingsTradingPlatform")}
        </h3>
        <div className="mt-4">
          <DetailRow
            label={t("settingsDefault")}
            value="Pioni"
            hint={t("settingsDefaultWorkspaceHint")}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <button
          type="button"
          onClick={() => {
            closeSettings();
            void clerk.signOut({ redirectUrl: "/trading" });
          }}
          className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#787774] hover:bg-[rgba(42,28,0,0.045)] hover:text-[#2C2C2B]"
        >
          {t("settingsSignOut")}
        </button>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const toast = useToast();
  const { setLanguage } = useLanguage();
  const [prefs, setPrefs] = useState<DisplayPrefs>(() => readDisplayPrefs());
  const [regional, setRegional] = useState<RegionalPrefs>(() => readRegionalPrefs());

  function update(next: Partial<DisplayPrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    writeDisplayPrefs(merged);
    toast("Preferences saved");
  }

  function saveRegional(next: Partial<RegionalPrefs>) {
    const merged = { ...regional, ...next };
    setRegional(merged);
    writeRegionalPrefs(merged);
    if (next.language) setLanguage(next.language);
    toast("Preferences saved");
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-base font-semibold text-[#2C2C2B]">Appearance</h3>
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#2C2C2B]">Theme</p>
          <p className="mt-0.5 text-sm text-[#787774]">
            Choose a theme for Pioni on this device
          </p>
          <SettingsSelect
            aria-label="Theme"
            value="light"
            options={THEME_OPTIONS}
            onChange={() => toast("Light is the only available theme")}
          />
          <p className="mt-2 text-xs text-[#A19E99]">
            Pioni uses a light monochrome theme.
          </p>
        </div>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Trading</h3>
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Default order type</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Choose the order type selected when you open the ticket
            </p>
            <SettingsSelect
              aria-label="Default order type"
              value={prefs.defaultOrderType}
              options={DEFAULT_ORDER_TYPE_OPTIONS}
              onChange={(defaultOrderType) => update({ defaultOrderType })}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Price decimals</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Choose how many decimals to show when filling limit prices
            </p>
            <SettingsSelect
              aria-label="Price decimals"
              value={prefs.priceDecimals}
              options={PRICE_DECIMALS_OPTIONS}
              onChange={(priceDecimals) => update({ priceDecimals })}
            />
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <ToggleRow
            title="Confirm before submitting orders"
            body="Ask for confirmation before market and limit orders are submitted."
            checked={prefs.confirmOrders}
            onChange={(checked) => update({ confirmOrders: checked })}
          />
          <ToggleRow
            title="Show jargon InfoTips"
            body="Add dashed underlines that explain trading terms like spread and mark price."
            checked={prefs.showInfoTips}
            onChange={(checked) => update({ showInfoTips: checked })}
          />
          <ToggleRow
            title="Play a sound on fills"
            body="A soft chime plays when a paper order fills or partially fills."
            checked={prefs.soundOnFill}
            onChange={(checked) => update({ soundOnFill: checked })}
          />
        </div>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Language & time</h3>
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Language</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Choose the language you want to use Pioni in
            </p>
            <SettingsSelect
              aria-label="Language"
              value={regional.language}
              options={[...LANGUAGE_OPTIONS]}
              onChange={(language) => saveRegional({ language })}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Currency</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Paper balances are denominated in USD.
            </p>
            <p className="mt-2 text-sm font-medium text-[#2C2C2B]">USD</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Number format</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Choose how numbers and currencies are formatted
            </p>
            <SettingsSelect
              aria-label="Number format"
              value={regional.numberFormat}
              options={NUMBER_FORMAT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={(numberFormat) => saveRegional({ numberFormat })}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C2C2B]">Time zone</p>
            <p className="mt-0.5 text-sm text-[#787774]">
              Choose your time zone
            </p>
            <SettingsSelect
              aria-label="Time zone"
              value={regional.timezone}
              options={TIMEZONE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={(timezone) => saveRegional({ timezone })}
            />
            <p className="mt-2 text-xs text-[#A19E99]">
              Reminders, notifications, and timestamps use this time zone.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Startup</h3>
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#2C2C2B]">Open on start</p>
          <p className="mt-0.5 text-sm text-[#787774]">
            Choose what opens when you start Pioni
          </p>
          <SettingsSelect
            aria-label="Open on start"
            value={prefs.startPage}
            options={START_PAGE_OPTIONS}
            onChange={(startPage) => update({ startPage })}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          setPrefs(DEFAULT_DISPLAY_PREFS);
          writeDisplayPrefs(DEFAULT_DISPLAY_PREFS);
          toast("Preferences reset");
        }}
        className="self-start rounded-[6px] px-3 py-1.5 text-sm text-[#787774] hover:bg-[rgba(42,28,0,0.045)] hover:text-[#2C2C2B]"
      >
        Reset preferences
      </button>
    </div>
  );
}

function PaperSection() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { closeSettings } = useSettings();
  const { startTour } = useTour();
  const { data: onboarding } = useGetMyOnboardingQuery(undefined, {
    skip: !isSignedIn,
  });
  const [patchOnboarding] = usePatchMyOnboardingMutation();
  const [resetPortfolio, { isLoading: resetting }] = useResetPortfolioMutation();
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-[#787774]">
          Sign in to reset paper balances or replay the product tour.
        </p>
        <button
          type="button"
          onClick={() => {
            closeSettings();
            navigate(SIGN_IN_PATH);
          }}
          className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function replayTour() {
    setBusy(true);
    try {
      await patchOnboarding({
        welcome_seen: true,
        tour_completed: false,
        tour_skipped: false,
        checklist_tour: false,
      }).unwrap();
      closeSettings();
      navigate("/trading");
      startTour({
        onComplete: () => {
          void patchOnboarding({
            tour_completed: true,
            checklist_tour: true,
          });
        },
        onSkip: () => {
          void patchOnboarding({ tour_skipped: true });
        },
      });
      toast("Tour started");
    } catch {
      toast("Couldn’t start tour");
    } finally {
      setBusy(false);
    }
  }

  async function resetPaper() {
    setBusy(true);
    try {
      await resetPortfolio().unwrap();
      setConfirmReset(false);
      toast("Paper account reset");
    } catch {
      toast("Couldn’t reset account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ActionCard
        title="Replay product tour"
        body="Walk through the chart, order ticket, book, and positions again."
        actionLabel={busy ? "Starting…" : "Start tour"}
        disabled={busy}
        onClick={() => void replayTour()}
      />
      <ActionCard
        title="Reset getting-started checklist"
        body={
          onboarding?.checklist_completed_at
            ? "Your checklist is complete. Reset it to practice the steps again."
            : "Clear checklist progress for the tour, first trade, and sentiment steps."
        }
        actionLabel="Reset checklist"
        disabled={busy}
        onClick={() => {
          void (async () => {
            setBusy(true);
            try {
              await patchOnboarding({
                checklist_tour: false,
                checklist_first_trade: false,
                checklist_view_position: false,
                checklist_sentiment: false,
                checklist_limit_order: false,
              }).unwrap();
              toast("Checklist reset");
            } catch {
              toast("Couldn’t reset checklist");
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <div className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-4">
        <p className="text-sm font-medium text-[#2C2C2B]">Reset paper account</p>
        <p className="mt-1 text-sm text-[#787774]">
          Restore starting cash and clear paper positions, orders, and fills.
        </p>
        {!confirmReset ? (
          <button
            type="button"
            disabled={busy || resetting}
            onClick={() => setConfirmReset(true)}
            className="mt-3 rounded-[6px] bg-rose-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Reset account…
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || resetting}
              onClick={() => void resetPaper()}
              className="rounded-[6px] bg-rose-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {resetting || busy ? "Resetting…" : "Confirm reset"}
            </button>
            <button
              type="button"
              disabled={busy || resetting}
              onClick={() => setConfirmReset(false)}
              className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#787774] hover:bg-[rgba(42,28,0,0.045)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const toast = useToast();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { setSection, closeSettings } = useSettings();
  const { data: remotePrefs } = useGetMyNotificationPrefsQuery(undefined, {
    skip: !isSignedIn,
  });
  const [patchRemotePrefs] = usePatchMyNotificationPrefsMutation();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    readNotificationPrefs(),
  );
  const [browserPermission, setBrowserPermission] = useState(() =>
    browserNotificationPermission(),
  );
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;

  useEffect(() => {
    if (!remotePrefs) return;
    const mapped = fromServerPrefs(remotePrefs);
    setPrefs(mapped);
    writeNotificationPrefs(mapped);
  }, [remotePrefs]);

  async function update(next: Partial<NotificationPrefs>) {
    const previous = prefs;
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    writeNotificationPrefs(merged);
    try {
      await patchRemotePrefs(toServerPrefsPatch(next)).unwrap();
      toast("Notification preferences saved");
    } catch {
      setPrefs(previous);
      writeNotificationPrefs(previous);
      toast("Could not save notification preferences");
    }
  }

  async function onToggleBrowserNotifications(checked: boolean) {
    if (!checked) {
      await update({ browserNotifications: false });
      return;
    }
    const permission = await requestBrowserNotificationPermission();
    setBrowserPermission(permission);
    if (permission !== "granted") {
      await update({ browserNotifications: false });
      if (permission === "denied") {
        toast("Browser notifications are blocked");
      } else if (permission === "unsupported") {
        toast("Browser notifications are not supported");
      } else {
        toast("Browser notification permission is required");
      }
      return;
    }
    await update({ browserNotifications: true });
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-[#787774]">
          Sign in to choose which order events notify you.
        </p>
        <button
          type="button"
          onClick={() => {
            closeSettings();
            navigate(SIGN_IN_PATH);
          }}
          className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-base font-semibold text-[#2C2C2B]">Preference</h3>
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#2C2C2B]">Trading updates</p>
          <p className="mt-0.5 text-sm text-[#787774]">
            Choose which order events can notify you
          </p>
          <SettingsSelect
            aria-label="Trading updates"
            value={prefs.mode}
            options={NOTIFY_MODE_OPTIONS}
            onChange={(mode: NotifyMode) => void update({ mode })}
          />
        </div>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Channels</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Choose where matching updates are delivered
        </p>
        <div className="mt-2 flex flex-col">
          <ToggleRow
            title="In-app toasts"
            body="Show pop-up toast cards while you are in Pioni"
            checked={prefs.toastPopups}
            onChange={(toastPopups) => void update({ toastPopups })}
          />
          <ToggleRow
            title="Email"
            body={
              email
                ? `Send important trading updates to ${email}`
                : "Add an email on your account to receive trading updates"
            }
            checked={prefs.emailEnabled}
            onChange={(emailEnabled) => void update({ emailEnabled })}
          />
          <ToggleRow
            title="Browser notifications"
            body={
              browserPermission === "unsupported"
                ? "This browser does not support notifications"
                : browserPermission === "denied"
                  ? "Notifications are blocked in browser settings"
                  : "Show desktop alerts when Pioni is open in a browser tab"
            }
            checked={prefs.browserNotifications}
            onChange={(checked) => void onToggleBrowserNotifications(checked)}
          />
        </div>
      </section>

      {prefs.mode === "custom" ? (
        <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
          <h3 className="text-base font-semibold text-[#2C2C2B]">Customization</h3>
          <p className="mt-1 text-sm text-[#787774]">
            Customize which order events can notify you
          </p>
          <div className="mt-2 flex flex-col">
            <ToggleRow
              title="Fills"
              body="Notify when an order is fully filled."
              checked={prefs.fills}
              onChange={(fills) => void update({ fills })}
            />
            <ToggleRow
              title="Partial fills"
              body="Notify when an order is partially filled."
              checked={prefs.partialFills}
              onChange={(partialFills) => void update({ partialFills })}
            />
            <ToggleRow
              title="Cancellations"
              body="Notify when an order is canceled."
              checked={prefs.cancellations}
              onChange={(cancellations) => void update({ cancellations })}
            />
            <ToggleRow
              title="Rejections"
              body="Notify when an order is rejected."
              checked={prefs.rejections}
              onChange={(rejections) => void update({ rejections })}
            />
            <ToggleRow
              title="Placements"
              body="Notify on new and open order status updates."
              checked={prefs.placements}
              onChange={(placements) => void update({ placements })}
            />
          </div>
        </section>
      ) : null}

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Inbox</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Recent fills stay in the right-rail inbox. Price alerts live on Trade under Alerts.
        </p>
        <p className="mt-3 text-sm text-[#787774]">
          Fill sound is managed in Preferences under Trading.
        </p>
        <button
          type="button"
          onClick={() => setSection("preferences")}
          className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
        >
          Open Preferences
        </button>
      </section>

      <button
        type="button"
        onClick={() => void update(DEFAULT_NOTIFICATION_PREFS)}
        className="self-start rounded-[6px] px-3 py-1.5 text-sm text-[#787774] hover:bg-[rgba(42,28,0,0.045)] hover:text-[#2C2C2B]"
      >
        Reset notification preferences
      </button>
    </div>
  );
}

function LimitsSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[10px] border border-[rgba(42,28,0,0.1)] bg-[#F9F8F7] p-4">
        <p className="text-sm font-semibold text-[#2C2C2B]">Paper trading</p>
        <p className="mt-1 text-sm text-[#787774]">
          Funding limits do not apply. Balances, deposits, and withdrawals on this
          account are simulated and are not real money.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PAPER_LIMIT_CARDS.map((card) => {
          const Icon = card.direction === "Deposit" ? DepositIcon : WithdrawIcon;
          return (
            <article
              key={card.id}
              className="flex flex-col rounded-[10px] border border-[rgba(42,28,0,0.1)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2C2C2B]">{card.title}</p>
                  <p className="mt-0.5 text-xs text-[#A19E99]">
                    {card.asset} · {card.period}
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#6B6B6B]">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <dl className="mt-4 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-[#787774]">Remaining</dt>
                  <dd className="text-sm font-semibold text-[#2C2C2B]">{card.remaining}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-[#787774]">Used</dt>
                  <dd className="text-sm font-medium text-[#2C2C2B]">{card.used}</dd>
                </div>
              </dl>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(28,19,1,0.08)]"
                aria-hidden
              >
                <div
                  className={`h-full rounded-full ${
                    card.remaining === "Unlimited"
                      ? "w-full bg-[var(--accent)]/35"
                      : "w-0 bg-[rgba(28,19,1,0.18)]"
                  }`}
                />
              </div>
              <p className="mt-3 text-xs text-[#A19E99]">{card.note}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  hint,
  mono,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2C2C2B]">{label}</p>
        <p
          className={`mt-0.5 text-sm text-[#787774] ${mono ? "font-mono text-xs tracking-wide" : ""}`}
        >
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-[#A19E99]">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[8px] px-1.5 py-3 hover:bg-[rgba(42,28,0,0.045)]">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#2C2C2B]">{title}</span>
        <span className="mt-0.5 block text-sm text-[#787774]">{body}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-[18px] w-[30px] shrink-0 rounded-full transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(0,0,0,0.2)] after:transition-transform ${
          checked
            ? "bg-[var(--accent)] after:translate-x-[12px]"
            : "bg-[rgba(28,19,1,0.18)]"
        }`}
      />
    </label>
  );
}

function ActionCard({
  title,
  body,
  actionLabel,
  onClick,
  disabled,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[rgba(42,28,0,0.1)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#2C2C2B]">{title}</p>
        <p className="mt-1 text-sm text-[#787774]">{body}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 rounded-[6px] border border-[rgba(42,28,0,0.1)] bg-white px-3 py-1.5 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)] disabled:opacity-60"
      >
        {actionLabel}
      </button>
    </div>
  );
}
