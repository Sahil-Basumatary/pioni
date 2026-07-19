import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CloseSmallIcon,
  InfoCircleIcon,
} from "../../components/shell/shellIcons";
import { dismissToast, type ToastItem, type ToastTone } from "./toastSlice";

const TONE_STYLES: Record<
  ToastTone,
  { bg: string; text: string; icon: string }
> = {
  positive: {
    bg: "bg-[rgba(20,158,97,0.08)]",
    text: "text-[#002d17]",
    icon: "text-[#08844f]",
  },
  negative: {
    bg: "bg-[rgba(245,57,94,0.08)]",
    text: "text-[#3c000c]",
    icon: "text-[#d11d45]",
  },
  warning: {
    bg: "bg-[rgba(195,150,33,0.08)]",
    text: "text-[#3b2a00]",
    icon: "text-[#9a7a1a]",
  },
  info: {
    bg: "bg-[rgba(0,146,216,0.08)]",
    text: "text-[#002940]",
    icon: "text-[#0077b3]",
  },
  neutral: {
    bg: "bg-[rgba(104,107,130,0.08)]",
    text: "text-[#101114]",
    icon: "text-[rgb(104,107,130)]",
  },
};

function ToneIcon({ tone, className }: { tone: ToastTone; className?: string }) {
  if (tone === "positive") return <CheckCircleIcon className={className} />;
  if (tone === "negative" || tone === "warning") {
    return <AlertCircleIcon className={className} />;
  }
  return <InfoCircleIcon className={className} />;
}

function ToastCard({ item }: { item: ToastItem }) {
  const dispatch = useAppDispatch();
  const [exiting, setExiting] = useState(false);
  const style = TONE_STYLES[item.tone];

  useEffect(() => {
    const hideAt = window.setTimeout(() => setExiting(true), item.durationMs);
    return () => window.clearTimeout(hideAt);
  }, [item.durationMs]);

  useEffect(() => {
    if (!exiting) return;
    const done = window.setTimeout(() => {
      dispatch(dismissToast(item.id));
    }, 220);
    return () => window.clearTimeout(done);
  }, [dispatch, exiting, item.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex w-[min(360px,calc(100vw-24px))] items-start gap-3 rounded-2xl px-3 py-3 shadow-[0_2px_6px_rgba(0,0,0,0.07)] transition-[transform,opacity] duration-200 ease-out ${style.bg} ${style.text} ${
        exiting ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${style.icon}`}>
        <ToneIcon tone={item.tone} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5">{item.title}</p>
        {item.body ? (
          <p className="mt-0.5 text-xs leading-4 opacity-80">{item.body}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setExiting(true)}
        className="rail-icon -mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)]"
      >
        <CloseSmallIcon className="size-4" />
      </button>
    </div>
  );
}

export default function ToastHost() {
  const items = useAppSelector((s) => s.toasts.items);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="pointer-events-none fixed bottom-16 left-3 z-[120] flex flex-col-reverse gap-2"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
}
