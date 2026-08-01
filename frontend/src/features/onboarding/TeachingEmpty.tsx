import { useNavigate } from "react-router-dom";
import { ArrowTopRightIcon } from "../../components/shell/shellIcons";
import { useLanguage } from "../auth/LanguageProvider";
import {
  TEACHING_EMPTY,
  type TeachingEmptyId,
} from "./teachingEmptyCopy";

export function focusOrderTicket() {
  const region = document.querySelector('[data-tour="order-ticket"]');
  const input =
    region?.querySelector<HTMLInputElement>('input[aria-label="Quantity BTC"]') ??
    region?.querySelector<HTMLInputElement>("input");
  region?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  input?.focus();
}

type TeachingEmptyProps = {
  id: TeachingEmptyId;
  size?: "compact" | "panel";
  onAction?: () => void;
};

export default function TeachingEmpty({
  id,
  size = "compact",
  onAction,
}: TeachingEmptyProps) {
  const entry = TEACHING_EMPTY[id];
  const { t } = useLanguage();
  const navigate = useNavigate();

  function runAction() {
    if (onAction) {
      onAction();
      return;
    }
    if (entry.action === "focus_ticket") {
      focusOrderTicket();
      return;
    }
    if (entry.action === "go_trade") {
      navigate("/trading");
    }
  }

  const pad = size === "panel" ? "px-4 py-12" : "px-4 py-8";
  const titleClass =
    size === "panel"
      ? "text-sm font-medium text-[var(--text-primary)]"
      : "text-xs font-medium text-[var(--text-primary)]";
  const bodyClass =
    size === "panel"
      ? "mt-1 max-w-md text-sm text-[var(--text-muted)]"
      : "mt-1 max-w-sm text-xs text-[var(--text-muted)]";

  return (
    <div className={`flex flex-col items-center text-center ${pad}`}>
      <p className={titleClass}>{t(entry.titleKey)}</p>
      <p className={bodyClass}>{t(entry.bodyKey)}</p>
      {entry.actionLabelKey && entry.action ? (
        <button
          type="button"
          onClick={runAction}
          className="rail-icon mt-3 inline-flex items-center gap-0.5 bg-transparent p-0 text-xs font-medium text-[var(--text-primary)] hover:bg-transparent hover:underline"
        >
          {t(entry.actionLabelKey)}
          <ArrowTopRightIcon className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
