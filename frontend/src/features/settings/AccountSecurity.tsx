import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  useClerk,
  useReverification,
  useSession,
  useUser,
} from "@clerk/clerk-react";
import { useToast } from "../toasts/useToast";
import { useSettings } from "./settingsContext";

type Panel = null | "email" | "password" | "totp" | "passkeys" | "delete";

type SessionRow = {
  id: string;
  lastActiveAt: Date;
  latestActivity?: {
    browserName?: string;
    deviceType?: string;
    city?: string;
    country?: string;
  };
  revoke: () => Promise<unknown>;
};

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

function clerkMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (err as { errors?: { longMessage?: string; message?: string }[] })
      .errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
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
  const { session } = useSession();
  const clerk = useClerk();
  const toast = useToast();
  const { closeSettings } = useSettings();
  const [panel, setPanel] = useState<Panel>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState<PendingEmail | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [totp, setTotp] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");

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

  async function refreshSessions() {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const list = (await user.getSessions()) as SessionRow[];
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    void refreshSessions();
  }, [user?.id]);

  function openPanel(next: Panel) {
    setPanel((cur) => (cur === next ? null : next));
    setEmailInput("");
    setEmailCode("");
    setPendingEmail(null);
    setCurrentPassword("");
    setNewPassword("");
    setTotp(null);
    setTotpCode("");
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
      toast("Verification code sent");
    } catch (err) {
      toast(clerkMessage(err));
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
      toast("Email updated");
    } catch (err) {
      toast(clerkMessage(err));
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
      toast("Password updated");
    } catch (err) {
      toast(clerkMessage(err));
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
      toast(clerkMessage(err));
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
      toast("Two-step verification enabled");
    } catch (err) {
      toast(clerkMessage(err));
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
      toast("Two-step verification disabled");
    } catch (err) {
      toast(clerkMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onAddPasskey() {
    setBusy(true);
    try {
      await createPasskey();
      await user?.reload();
      toast("Passkey added");
    } catch (err) {
      toast(clerkMessage(err));
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
      toast("Passkey removed");
    } catch (err) {
      toast(clerkMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteAccount() {
    setBusy(true);
    try {
      await deleteUser();
      closeSettings();
      toast("Account deleted");
      await clerk.signOut({ redirectUrl: "/home" });
    } catch (err) {
      toast(clerkMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRevokeSession(id: string) {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    setBusy(true);
    try {
      await target.revoke();
      await refreshSessions();
      toast("Signed out of device");
    } catch (err) {
      toast(clerkMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRevokeOtherSessions() {
    setBusy(true);
    try {
      const others = sessions.filter((s) => s.id !== session?.id);
      await Promise.all(others.map((s) => s.revoke()));
      await refreshSessions();
      toast("Signed out of other devices");
    } catch (err) {
      toast(clerkMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const totpBody = user.totpEnabled
    ? "You have two-step verification enabled"
    : "Add an authenticator app for an extra sign-in step";
  const passkeyCount = user.passkeys?.length ?? 0;

  return (
    <div className="flex flex-col gap-8 border-t border-[rgba(42,28,0,0.07)] pt-6">
      <div>
        <h3 className="text-base font-semibold text-[#2C2C2B]">Account security</h3>
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <SecurityRow
              title="Email"
              body={primaryEmail}
              action={
                <SettingsBtn onClick={() => openPanel("email")}>Manage emails</SettingsBtn>
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
                          <span className="ml-2 text-xs text-[#A19E99]">Primary</span>
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
                      placeholder="Add email address"
                      className="h-8 w-full max-w-md rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy ? "Sending…" : "Add email"}
                    </SettingsBtn>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => void onVerifyEmail(e)}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs text-[#787774]">
                      Enter the code sent to {pendingEmail.emailAddress}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="Verification code"
                      className="h-8 w-full max-w-xs rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy ? "Verifying…" : "Verify email"}
                    </SettingsBtn>
                  </form>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title="Password"
              body="Change the password you use to log in"
              action={
                <SettingsBtn onClick={() => openPanel("password")}>
                  Change password
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
                    placeholder="Current password"
                    className="h-8 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                  />
                ) : null}
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-8 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                />
                <div className="flex gap-2">
                  <SettingsBtn type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Update password"}
                  </SettingsBtn>
                  <SettingsBtn onClick={() => setPanel(null)}>Cancel</SettingsBtn>
                </div>
              </form>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title="Two-step verification"
              body={totpBody}
              action={
                <SettingsBtn onClick={() => openPanel("totp")}>
                  Manage verification methods
                </SettingsBtn>
              }
            />
            {panel === "totp" ? (
              <div className="mt-3 rounded-[8px] border border-[rgba(42,28,0,0.1)] p-3">
                {user.totpEnabled ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[#787774]">
                      Authenticator app is enabled on this account.
                    </p>
                    <SettingsBtn
                      danger
                      disabled={busy}
                      onClick={() => void onDisableTotp()}
                    >
                      {busy ? "Disabling…" : "Disable authenticator"}
                    </SettingsBtn>
                  </div>
                ) : !totp ? (
                  <SettingsBtn disabled={busy} onClick={() => void onStartTotp()}>
                    {busy ? "Preparing…" : "Set up authenticator app"}
                  </SettingsBtn>
                ) : (
                  <form
                    onSubmit={(e) => void onVerifyTotp(e)}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs text-[#787774]">
                      Add this key in your authenticator app, then enter a code.
                    </p>
                    <code className="break-all rounded-[6px] bg-black/[0.04] px-2 py-1.5 text-xs text-[#2C2C2B]">
                      {totp.secret}
                    </code>
                    {totp.uri ? (
                      <a
                        href={totp.uri}
                        className="text-xs text-[var(--accent)] underline"
                      >
                        Open setup link
                      </a>
                    ) : null}
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="h-8 w-full max-w-xs rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm"
                    />
                    <SettingsBtn type="submit" disabled={busy}>
                      {busy ? "Verifying…" : "Verify and enable"}
                    </SettingsBtn>
                  </form>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <SecurityRow
              title="Passkeys"
              body={
                passkeyCount > 0
                  ? `${passkeyCount} passkey${passkeyCount === 1 ? "" : "s"} on this account`
                  : "Sign in with on-device biometric authentication"
              }
              action={
                <SettingsBtn onClick={() => openPanel("passkeys")}>
                  Manage passkeys
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
                      <span>{key.name || "Passkey"}</span>
                      <SettingsBtn
                        danger
                        disabled={busy}
                        onClick={() => void onDeletePasskey(key.id)}
                      >
                        Remove
                      </SettingsBtn>
                    </li>
                  ))}
                  {(user.passkeys ?? []).length === 0 ? (
                    <li className="text-sm text-[#787774]">No passkeys yet.</li>
                  ) : null}
                </ul>
                <SettingsBtn disabled={busy} onClick={() => void onAddPasskey()}>
                  {busy ? "Waiting…" : "Add passkey"}
                </SettingsBtn>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Delete my account</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Permanently delete your account. You’ll no longer be able to access this
          paper profile.
        </p>
        {panel === "delete" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <SettingsBtn danger disabled={busy} onClick={() => void onDeleteAccount()}>
              {busy ? "Deleting…" : "Confirm delete"}
            </SettingsBtn>
            <SettingsBtn onClick={() => setPanel(null)}>Cancel</SettingsBtn>
          </div>
        ) : (
          <div className="mt-3">
            <SettingsBtn danger onClick={() => openPanel("delete")}>
              Delete my account
            </SettingsBtn>
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#2C2C2B]">Devices</h3>
            <p className="mt-1 text-sm text-[#787774]">
              Log out of active sessions on all your devices, other than this one
            </p>
          </div>
          <SettingsBtn
            danger
            disabled={busy || sessionsLoading || sessions.length <= 1}
            onClick={() => void onRevokeOtherSessions()}
          >
            Log out of all devices
          </SettingsBtn>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[480px] grid-cols-[1.2fr_1fr_1.4fr_auto] gap-2 border-b border-[rgba(42,28,0,0.07)] pb-2 text-xs font-medium text-[#A19E99]">
            <span>Device Name</span>
            <span>Last Active</span>
            <span>Location</span>
            <span />
          </div>
          {sessionsLoading ? (
            <p className="py-3 text-sm text-[#787774]">Loading devices…</p>
          ) : sessions.length === 0 ? (
            <p className="py-3 text-sm text-[#787774]">No active sessions found.</p>
          ) : (
            sessions.map((item) => {
              const activity = item.latestActivity;
              const name =
                [activity?.browserName, activity?.deviceType]
                  .filter(Boolean)
                  .join(" · ") || "Session";
              const location =
                [activity?.city, activity?.country].filter(Boolean).join(", ") ||
                "—";
              const isCurrent = item.id === session?.id;
              return (
                <div
                  key={item.id}
                  className="grid min-w-[480px] grid-cols-[1.2fr_1fr_1.4fr_auto] items-center gap-2 border-b border-[rgba(42,28,0,0.05)] py-2.5 text-sm text-[#2C2C2B]"
                >
                  <span>
                    {name}
                    {isCurrent ? (
                      <span className="ml-2 text-xs text-[#A19E99]">This Device</span>
                    ) : null}
                  </span>
                  <span className="text-[#787774]">
                    {isCurrent
                      ? "Now"
                      : item.lastActiveAt.toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                  </span>
                  <span className="text-[#787774]">{location}</span>
                  <span>
                    {!isCurrent ? (
                      <SettingsBtn
                        disabled={busy}
                        onClick={() => void onRevokeSession(item.id)}
                      >
                        Log out
                      </SettingsBtn>
                    ) : null}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <p className="text-sm font-semibold text-[#2C2C2B]">User ID</p>
        <p className="mt-1 font-mono text-xs tracking-wide text-[#787774]">{user.id}</p>
      </div>
    </div>
  );
}
