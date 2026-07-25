import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "../toasts/useToast";
import {
  useCreateMyApiKeyMutation,
  useGetMyApiKeysQuery,
  useRevokeMyApiKeyMutation,
  type PaperApiKeyCreated,
} from "./apiKeysApi";
import { SIGN_IN_PATH } from "../auth/authRoutes";

function scopeLabel(canQuery: boolean, canTrade: boolean): string {
  const parts: string[] = [];
  if (canQuery) parts.push("Query");
  if (canTrade) parts.push("Trade");
  return parts.join(", ") || "None";
}

export default function ConnectionsSection() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: keys = [], isLoading } = useGetMyApiKeysQuery(undefined, {
    skip: !isSignedIn,
  });
  const [createKey, { isLoading: creating }] = useCreateMyApiKeyMutation();
  const [revokeKey, { isLoading: revoking }] = useRevokeMyApiKeyMutation();
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [name, setName] = useState("");
  const [canQuery, setCanQuery] = useState(true);
  const [canTrade, setCanTrade] = useState(true);
  const [created, setCreated] = useState<PaperApiKeyCreated | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-[#787774]">
          Sign in to manage connected apps and paper API keys.
        </p>
        <button
          type="button"
          onClick={() => navigate(SIGN_IN_PATH)}
          className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const row = await createKey({
        name: name.trim(),
        can_query: canQuery,
        can_trade: canTrade,
      }).unwrap();
      setCreated(row);
      setCreatingOpen(false);
      setName("");
      setCanQuery(true);
      setCanTrade(true);
      toast("API key created");
    } catch {
      toast("Couldn’t create API key");
    }
  }

  async function onRevoke(id: string) {
    try {
      await revokeKey(id).unwrap();
      setRevokeId(null);
      toast("API key revoked");
    } catch {
      toast("Couldn’t revoke API key");
    }
  }

  async function copySecret() {
    if (!created?.api_key) return;
    try {
      await navigator.clipboard.writeText(created.api_key);
      toast("API key copied");
    } catch {
      toast("Couldn’t copy API key");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-base font-semibold text-[#2C2C2B]">Connected apps</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Apps you’ve authorized to access your paper account will appear here.
        </p>
        <div className="mt-4 rounded-[10px] border border-[rgba(42,28,0,0.1)] px-4 py-6 text-center">
          <p className="text-sm font-medium text-[#2C2C2B]">No connected apps</p>
          <p className="mt-1 text-sm text-[#787774]">
            Third-party connections are not available yet.
          </p>
        </div>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#2C2C2B]">API keys</h3>
            <p className="mt-1 text-sm text-[#787774]">
              Create paper API keys for Query and Trade access. Withdrawal
              permissions are never granted.
            </p>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => {
              setCreated(null);
              setCreatingOpen(true);
            }}
            className="inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)] disabled:opacity-60"
          >
            Create API key
          </button>
        </div>

        {creatingOpen ? (
          <form
            onSubmit={(e) => void onCreate(e)}
            className="mt-4 flex max-w-lg flex-col gap-3 rounded-[10px] border border-[rgba(42,28,0,0.1)] p-4"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#2C2C2B]">Key name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Trading bot"
                className="h-8 rounded-[6px] border border-[rgba(42,28,0,0.12)] px-2.5 text-sm text-[#2C2C2B]"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#2C2C2B]">
              <input
                type="checkbox"
                checked={canQuery}
                onChange={(e) => setCanQuery(e.target.checked)}
              />
              Query
            </label>
            <label className="flex items-center gap-2 text-sm text-[#2C2C2B]">
              <input
                type="checkbox"
                checked={canTrade}
                onChange={(e) => setCanTrade(e.target.checked)}
              />
              Trade
            </label>
            <p className="text-xs text-[#A19E99]">
              Paper keys cannot withdraw funds.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={creating || (!canQuery && !canTrade)}
                className="inline-flex h-7 items-center rounded-[6px] bg-[var(--accent)] px-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setCreatingOpen(false)}
                className="inline-flex h-7 items-center rounded-[6px] px-2 text-sm font-medium text-[#787774] hover:bg-[rgba(42,28,0,0.045)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {created ? (
          <div className="mt-4 rounded-[10px] border border-[rgba(42,28,0,0.1)] bg-[#F9F8F7] p-4">
            <p className="text-sm font-semibold text-[#2C2C2B]">
              Copy your API key now
            </p>
            <p className="mt-1 text-sm text-[#787774]">
              This is the only time the full key is shown. Store it somewhere safe.
            </p>
            <code className="mt-3 block break-all rounded-[8px] bg-white px-3 py-2 font-mono text-xs text-[#2C2C2B] ring-1 ring-[rgba(42,28,0,0.08)]">
              {created.api_key}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copySecret()}
                className="inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setCreated(null)}
                className="inline-flex h-7 items-center rounded-[6px] px-2 text-sm font-medium text-[#787774] hover:bg-[rgba(42,28,0,0.045)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[1.2fr_1fr_1.2fr_auto] gap-2 border-b border-[rgba(42,28,0,0.07)] pb-2 text-xs font-medium text-[#A19E99]">
            <span>Name</span>
            <span>Prefix</span>
            <span>Permissions</span>
            <span />
          </div>
          {isLoading ? (
            <p className="py-3 text-sm text-[#787774]">Loading API keys…</p>
          ) : keys.length === 0 ? (
            <p className="py-3 text-sm text-[#787774]">No API keys yet.</p>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="grid min-w-[520px] grid-cols-[1.2fr_1fr_1.2fr_auto] items-center gap-2 border-b border-[rgba(42,28,0,0.05)] py-2.5 text-sm text-[#2C2C2B]"
              >
                <span className="truncate font-medium">{key.name}</span>
                <span className="font-mono text-xs text-[#787774]">
                  {key.key_prefix}…
                </span>
                <span className="text-[#787774]">
                  {scopeLabel(key.can_query, key.can_trade)}
                </span>
                <span>
                  {revokeId === key.id ? (
                    <span className="flex gap-2">
                      <button
                        type="button"
                        disabled={revoking}
                        onClick={() => void onRevoke(key.id)}
                        className="inline-flex h-7 items-center rounded-[6px] bg-[rgba(223,22,0,0.094)] px-2 text-sm font-medium text-[#E56458] disabled:opacity-60"
                      >
                        {revoking ? "Revoking…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevokeId(null)}
                        className="inline-flex h-7 items-center rounded-[6px] px-2 text-sm font-medium text-[#787774]"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRevokeId(key.id)}
                      className="inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
                    >
                      Revoke
                    </button>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
