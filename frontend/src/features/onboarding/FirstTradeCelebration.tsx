import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { CloseSmallIcon } from "../../components/shell/shellIcons";
import { useGetMyTradesQuery } from "../portfolio/portfolioApi";
import {
  useGetMyOnboardingQuery,
  usePatchMyOnboardingMutation,
} from "./onboardingApi";
import {
  buildFirstTradeRecap,
  pickCelebrationTrade,
  wantsForceCelebration,
} from "./celebrationRecap";
import "./firstTradeCelebration.css";

const PIECE_COLORS = [
  "rgb(20, 158, 97)",
  "rgb(88, 101, 242)",
  "rgb(245, 166, 35)",
  "rgb(245, 57, 94)",
  "rgb(104, 107, 130)",
];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const left = (i * 17) % 100;
        const delay = (i % 12) * 0.05;
        const duration = 1.6 + (i % 7) * 0.12;
        const dx = `${((i * 37) % 80) - 40}px`;
        return { left, delay, duration, dx, color: PIECE_COLORS[i % PIECE_COLORS.length] };
      }),
    [],
  );
  return (
    <div className="pioni-celebrate-burst" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="pioni-celebrate-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--dx" as string]: p.dx,
          }}
        />
      ))}
    </div>
  );
}

export default function FirstTradeCelebration() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const titleId = useId();
  const descId = useId();
  const force = wantsForceCelebration();
  const { data: onboarding, isSuccess } = useGetMyOnboardingQuery(undefined, {
    skip: !isSignedIn,
  });
  const needsFirst =
    force || (isSuccess && onboarding && !onboarding.checklist_first_trade);
  const { data: trades } = useGetMyTradesQuery(
    { limit: 20 },
    { skip: !isSignedIn || !needsFirst },
  );
  const [patchOnboarding] = usePatchMyOnboardingMutation();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const trade = pickCelebrationTrade(trades, force);
  const recap = trade ? buildFirstTradeRecap(trade) : null;
  const open =
    Boolean(isSignedIn) &&
    !dismissed &&
    Boolean(needsFirst) &&
    Boolean(recap);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function finish(goPositions: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (!force) {
        await patchOnboarding({ checklist_first_trade: true }).unwrap();
      }
    } catch {
      // still dismiss so the user isn't stuck
    } finally {
      setDismissed(true);
      setBusy(false);
      if (force) {
        const params = new URLSearchParams(window.location.search);
        params.delete("celebrate");
        const qs = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
        );
      }
      if (goPositions) {
        navigate("/trading");
        requestAnimationFrame(() => {
          document
            .querySelector('[data-tour="positions"]')
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    }
  }

  if (!open || !recap) return null;

  return createPortal(
    <div
      className="pioni-celebrate-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4"
      role="presentation"
      onClick={() => void finish(false)}
    >
      <ConfettiBurst />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="pioni-celebrate-card relative z-[1] w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              First paper trade
            </p>
            <h2
              id={titleId}
              className="mt-1 text-lg font-semibold text-[var(--text-primary)]"
            >
              {recap.headline}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            disabled={busy}
            onClick={() => void finish(false)}
            className="rail-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)]"
          >
            <CloseSmallIcon className="h-4 w-4" />
          </button>
        </div>
        <p id={descId} className="mt-2 text-sm text-[var(--text-muted)]">
          {recap.detail}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void finish(true)}
            className="rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "View positions"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void finish(false)}
            className="rail-icon rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--text-muted)]"
          >
            Keep trading
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
