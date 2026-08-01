import { useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  useClerk,
  useReverification,
  useUser,
} from "@clerk/clerk-react";
import { useLanguage } from "../auth/LanguageProvider";
import { useToast } from "../toasts/useToast";
import ActiveSessionsPanel from "./ActiveSessionsPanel";
import { deleteAccountCommand } from "./deleteAccountCommand";
import { useSettings } from "./settingsContext";

type Panel = null | "email" | "password" | "totp" | "passkeys" | "delete";

type PendingEmail = {
  id: string;
  emailAddress: string;
  prepareVerification: (params: { strategy: "email_code" }) => Promise<unknown>;
  attemptVerification: (params: { code: string }) => Promise<unknown>;
};

type TotpSetup = {
  secret?: string | null;
  uri?: string | null;
};

function clerkMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (err as { errors?: { longMessage?: string; message?: string }[] })
      .errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function SettingsBtn({
  children,
  onClick,
  danger,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 shrink-0 items-center rounded-[6px] px-2 text-sm font-medium disabled:opacity-50 ${
        danger
          ? "bg-[rgba(223,22,0,0.094)] text-[#E56458]"
          : "border border-[rgba(28,19,1,0.11)] bg-transparent text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
      }`}
    >
      {children}
    </button>
  );
}

function SecurityRow({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2C2C2B]">{title}</p>
        <p className="mt-0.5 text-sm text-[#787774]">{body}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default function AccountSecurity() {
  const { user } = useUser();
  const clerk = useClerk();
  const toast = useToast();
  const { t } = useLanguage();
  const { closeSettings } = useSettings();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState<PendingEmail | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [totp, setTotp] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const updatePassword = useReverification(
    (params: { currentPassword: string; newPassword: string }) =>
      user?.updatePassword({
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
        signOutOfOtherSessions: true,
      }),
  );
  const createEmailAddress = useReverification((email: string) =>
    user?.createEmailAddress({ email }),
  );
  const createTOTP = useReverification(() => user?.createTOTP());
  const disableTOTP = useReverification(() => user?.disableTOTP());
  const createPasskey = useReverification(() => user?.createPasskey());
  const deleteUser = useReverification(() => user?.delete());

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "—";

  function openPanel(next: Panel) {
    setPanel((cur) => (cur === next ? null : next));
    setEmailInput("");
    setEmailCode("");
    setPendingEmail(null);
    setCurrentPassword("");
    setNewPassword("");
    setTotp(null);
    setTotpCode("");
    setDeleteConfirmInput("");
  }

  function closeDeleteConfirm() {
    setPanel(null);
    setDeleteConfirmInput("");
  }

  async function onAddEmail(e: FormEvent) {
    e.preventDefault();
    if (!user || !emailInput.trim()) return;
    setBusy(true);
    try {
      const created = await createEmailAddress(emailInput.trim());
      await user.reload();
      const emailObj =
        (user.emailAddresses.find((a) => a.id === created?.id) as
          | PendingEmail
          | undefined) ?? (created as PendingEmail | null | undefined) ?? null;
      if (!emailObj) throw new Error("Email not found after create");
      await emailObj.prepareVerification({ strategy: "email_code" });
      setPendingEmail(emailObj);
      toast(t("settingsVerificationCodeSent"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyEmail(e: FormEvent) {
    e.preventDefault();
    if (!user || !pendingEmail || !emailCode.trim()) return;
    setBusy(true);
    try {
      await pendingEmail.attemptVerification({ code: emailCode.trim() });
      await user.update({ primaryEmailAddressId: pendingEmail.id });
      await user.reload();
      setPendingEmail(null);
      setEmailCode("");
      setEmailInput("");
      setPanel(null);
      toast(t("settingsEmailUpdated"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!newPassword) return;
    setBusy(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPanel(null);
      toast(t("settingsPasswordUpdated"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onStartTotp() {
    setBusy(true);
    try {
      const resource = await createTOTP();
      if (resource) setTotp(resource as TotpSetup);
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyTotp(e: FormEvent) {
    e.preventDefault();
    if (!user || !totpCode.trim()) return;
    setBusy(true);
    try {
      await user.verifyTOTP({ code: totpCode.trim() });
      await user.reload();
      setTotp(null);
      setTotpCode("");
      setPanel(null);
      toast(t("settingsTwoStepEnabledToast"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onDisableTotp() {
    setBusy(true);
    try {
      await disableTOTP();
      await user?.reload();
      setPanel(null);
      toast(t("settingsTwoStepDisabledToast"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onAddPasskey() {
    setBusy(true);
    try {
      await createPasskey();
      await user?.reload();
      toast(t("settingsPasskeyAdded"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onDeletePasskey(id: string) {
    const key = user?.passkeys.find((p) => p.id === id);
    if (!key) return;
    setBusy(true);
    try {
      await key.delete();
      await user?.reload();
      toast(t("settingsPasskeyRemoved"));
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteAccount(e?: FormEvent) {
    e?.preventDefault();
    if (!user) return;
    const username =
      user.username?.trim() ||
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    if (!username) {
      toast(t("settingsCouldntResolveUsername"));
      return;
    }
    const expected = deleteAccountCommand(username);
    if (deleteConfirmInput !== expected) {
      toast(t("settingsTypeDeleteCommand"));
      return;
    }
    setBusy(true);
    try {
      await deleteUser();
      closeDeleteConfirm();
      closeSettings();
      toast(t("settingsAccountDeleted"));
      await clerk.signOut({ redirectUrl: "/trading" });
    } catch (err) {
      toast(clerkMessage(err, t("settingsSomethingWentWrong")));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const totpBody = user.totpEnabled
    ? t("settingsTwoStepEnabled")
    : t("settingsTwoStepAdd");
  const passkeyCount = user.passkeys?.length ?? 0;
  const deleteUsername =
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const expectedDeleteCommand = deleteUsername
    ? deleteAccountCommand(deleteUsername)
    : "";
  const deleteCommandMatches =
    Boolean(expectedDeleteCommand) &&
    deleteConfirmInput === expectedDeleteCommand;

  return (
    <div className="flex flex-col gap-8 border-t border-[rgba(42,28,0,0.07)] pt-6">
      <div>
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          {t("settingsAccountSecurity")}
        </h3>
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <SecurityRow
              title={t("settingsEmail")}
              body={primaryEmail}
              action={
                <SettingsBtn onClick={() => openPanel("email")}>
                  {t("settingsManageEmails")}
                </SettingsBtn>
              }
            />
            {panel === "email" ? (
              <div className="mt-3 rounded-[8px] border border-[rgba(42,28,0,0.1)] p-3">
                <ul className="mb-3 flex flex-col gap-1.5">
                  {user.emailAddresses.map((addr) => (
                    <li
                      key={addr.id}
                      className="flex items-center justify-between gap-2 text-sm text-[#2C2C2B]"
                    >
                      <span>
                        {addr.emailAddress}
                        {user.primaryEmailAddressId === addr.id ? (
                          <span className="ml-2 text-xs text-[#A19E99]">
                            {t("settingsPrimary")}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {!pendingEmail ? (
                  <form onSubmit={(e) => void onAddEmail(e)} className="flex flex-col gap-2">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={t("settingsAddEmailPlaceholder")}
                      className="h-8 w-full max-w-md rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy ? t("settingsSending") : t("settingsAddEmail")}
                    </SettingsBtn>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => void onVerifyEmail(e)}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs text-[#787774]">
                      {t("settingsEnterCodeSentTo", {
                        email: pendingEmail.emailAddress,
                      })}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder={t("settingsVerificationCode")}
                      className="h-8 w-full max-w-xs rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy ? t("settingsVerifying") : t("settingsVerifyEmail")}
                    </SettingsBtn>
                  </form>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title={t("settingsPassword")}
              body={t("settingsPasswordBody")}
              action={
                <SettingsBtn onClick={() => openPanel("password")}>
                  {t("settingsChangePassword")}
                </SettingsBtn>
              }
            />
            {panel === "password" ? (
              <form
                onSubmit={(e) => void onChangePassword(e)}
                className="mt-3 flex max-w-md flex-col gap-2 rounded-[8px] border border-[rgba(42,28,0,0.1)] p-3"
              >
                {user.passwordEnabled ? (
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("settingsCurrentPassword")}
                    className="h-8 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                  />
                ) : null}
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("settingsNewPassword")}
                  className="h-8 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                />
                <div className="flex gap-2">
                  <SettingsBtn type="submit" disabled={busy}>
                    {busy ? t("settingsSaving") : t("settingsUpdatePassword")}
                  </SettingsBtn>
                  <SettingsBtn onClick={() => setPanel(null)}>
                    {t("tradeCancel")}
                  </SettingsBtn>
                </div>
              </form>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title={t("settingsTwoStep")}
              body={totpBody}
              action={
                <SettingsBtn onClick={() => openPanel("totp")}>
                  {t("settingsManageVerification")}
                </SettingsBtn>
              }
            />
            {panel === "totp" ? (
              <div className="mt-3 rounded-[8px] border border-[rgba(42,28,0,0.1)] p-3">
                {user.totpEnabled ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[#787774]">
                      {t("settingsAuthenticatorEnabled")}
                    </p>
                    <SettingsBtn
                      danger
                      disabled={busy}
                      onClick={() => void onDisableTotp()}
                    >
                      {busy
                        ? t("settingsDisabling")
                        : t("settingsDisableAuthenticator")}
                    </SettingsBtn>
                  </div>
                ) : !totp ? (
                  <SettingsBtn disabled={busy} onClick={() => void onStartTotp()}>
                    {busy
                      ? t("settingsPreparing")
                      : t("settingsSetupAuthenticator")}
                  </SettingsBtn>
                ) : (
                  <form
                    onSubmit={(e) => void onVerifyTotp(e)}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs text-[#787774]">
                      {t("settingsAuthenticatorSetupHint")}
                    </p>
                    <code className="break-all rounded-[6px] bg-black/[0.04] px-2 py-1.5 text-xs text-[#2C2C2B]">
                      {totp.secret}
                    </code>
                    {totp.uri ? (
                      <a
                        href={totp.uri}
                        className="text-xs text-[var(--accent)] underline"
                      >
                        {t("settingsOpenSetupLink")}
                      </a>
                    ) : null}
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder={t("settingsSixDigitCode")}
                      className="h-8 w-full max-w-xs rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy
                        ? t("settingsVerifying")
                        : t("settingsVerifyAndEnable")}
                    </SettingsBtn>
                  </form>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title={t("settingsPasskeys")}
              body={
                passkeyCount > 0
                  ? t(
                      passkeyCount === 1
                        ? "settingsPasskeyCountOne"
                        : "settingsPasskeyCountMany",
                      { count: String(passkeyCount) },
                    )
                  : t("settingsPasskeysEmptyBody")
              }
              action={
                <SettingsBtn onClick={() => openPanel("passkeys")}>
                  {t("settingsManagePasskeys")}
                </SettingsBtn>
              }
            />
            {panel === "passkeys" ? (
              <div className="mt-3 rounded-[8px] border border-[rgba(42,28,0,0.1)] p-3">
                <ul className="mb-3 flex flex-col gap-2">
                  {(user.passkeys ?? []).map((key) => (
                    <li
                      key={key.id}
                      className="flex items-center justify-between gap-2 text-sm text-[#2C2C2B]"
                    >
                      <span>{key.name || t("settingsPasskeyFallback")}</span>
                      <SettingsBtn
                        danger
                        disabled={busy}
                        onClick={() => void onDeletePasskey(key.id)}
                      >
                        {t("settingsRemove")}
                      </SettingsBtn>
                    </li>
                  ))}
                  {(user.passkeys ?? []).length === 0 ? (
                    <li className="text-sm text-[#787774]">
                      {t("settingsNoPasskeysYet")}
                    </li>
                  ) : null}
                </ul>
                <SettingsBtn disabled={busy} onClick={() => void onAddPasskey()}>
                  {busy ? t("settingsWaiting") : t("settingsAddPasskey")}
                </SettingsBtn>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">
          {t("settingsDeleteMyAccount")}
        </h3>
        <p className="mt-1 text-sm text-[#787774]">
          {t("settingsDeleteAccountBlurb")}
        </p>
        <div className="mt-3">
          <SettingsBtn
            danger
            onClick={() => {
              setDeleteConfirmInput("");
              setPanel("delete");
            }}
          >
            {t("settingsDeleteMyAccount")}
          </SettingsBtn>
        </div>
      </div>

      {panel === "delete"
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label={t("settingsDismissDeleteConfirm")}
                className="absolute inset-0 bg-[rgba(15,15,15,0.6)]"
                onClick={closeDeleteConfirm}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                className="relative z-[1] w-full max-w-[420px] rounded-[12px] bg-white p-6 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14),0_0_0_1px_rgba(42,28,0,0.07)]"
              >
                <h3
                  id="delete-account-title"
                  className="text-base font-semibold text-[#2C2C2B]"
                >
                  {t("settingsDeleteMyAccount")}
                </h3>
                <p className="mt-1 text-sm text-[#787774]">
                  {t("settingsDeleteConfirmBlurb")}
                </p>
                {expectedDeleteCommand ? (
                  <code className="mt-3 block break-all rounded-[8px] bg-black/[0.04] px-3 py-2 font-mono text-xs text-[#2C2C2B]">
                    {expectedDeleteCommand}
                  </code>
                ) : (
                  <p className="mt-3 text-sm text-[#E56458]">
                    {t("settingsNoUsernameForDelete")}
                  </p>
                )}
                <form
                  onSubmit={(e) => void onDeleteAccount(e)}
                  className="mt-4 flex flex-col gap-3"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#2C2C2B]">
                      {t("settingsConfirmationCommand")}
                    </span>
                    <input
                      type="text"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder={
                        expectedDeleteCommand || 'sudo delete "username"'
                      }
                      aria-label={t("settingsDeleteConfirmAria")}
                      className="h-9 w-full rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 font-mono text-sm text-[#2C2C2B]"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <SettingsBtn
                      type="submit"
                      danger
                      disabled={busy || !deleteCommandMatches}
                    >
                      {busy
                        ? t("settingsDeleting")
                        : t("settingsDeleteMyAccount")}
                    </SettingsBtn>
                    <SettingsBtn onClick={closeDeleteConfirm}>
                      {t("tradeCancel")}
                    </SettingsBtn>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <ActiveSessionsPanel />
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <p className="text-sm font-semibold text-[#2C2C2B]">
          {t("settingsUserId")}
        </p>
        <p className="mt-1 font-mono text-xs tracking-wide text-[#787774]">{user.id}</p>
      </div>
    </div>
  );
}
