import { useEffect, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { useToast } from "../toasts/useToast";

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

function SessionBtn({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
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

export default function ActiveSessionsPanel() {
  const { user } = useUser();
  const { session } = useSession();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#2C2C2B]">Devices</h3>
          <p className="mt-1 text-sm text-[#787774]">
            Log out of active sessions on all your devices, other than this one
          </p>
        </div>
        <SessionBtn
          danger
          disabled={busy || sessionsLoading || sessions.length <= 1}
          onClick={() => void onRevokeOtherSessions()}
        >
          Log out of all devices
        </SessionBtn>
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
                    <SessionBtn
                      disabled={busy}
                      onClick={() => void onRevokeSession(item.id)}
                    >
                      Log out
                    </SessionBtn>
                  ) : null}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
