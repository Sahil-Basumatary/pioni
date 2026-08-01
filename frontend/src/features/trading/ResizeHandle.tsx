import { useLanguage } from "../auth/LanguageProvider";

type ResizeHandleProps = {
  orientation: "vertical" | "horizontal";
  label: string;
  active?: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onDoubleClick?: () => void;
};

export default function ResizeHandle({
  orientation,
  label,
  active = false,
  onPointerDown,
  onDoubleClick,
}: ResizeHandleProps) {
  const { t } = useLanguage();
  const vertical = orientation === "vertical";
  const lineTone = active
    ? "bg-[var(--accent)] opacity-100"
    : "bg-transparent opacity-0 group-hover:bg-[var(--accent)]/70 group-hover:opacity-100";
  return (
    <button
      type="button"
      aria-label={label}
      title={t("tradeResizeResetHint", { label })}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={[
        "group relative z-20 shrink-0 touch-none border-0 bg-transparent p-0",
        vertical
          ? "hidden w-px cursor-col-resize self-stretch md:block"
          : "hidden h-px w-full cursor-row-resize md:block",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute",
          vertical
            ? "inset-y-0 -left-1.5 w-3"
            : "inset-x-0 -top-1.5 h-3",
        ].join(" ")}
      />
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute rounded-full transition-colors",
          lineTone,
          vertical
            ? "inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
            : "inset-x-0 top-1/2 h-0.5 -translate-y-1/2",
        ].join(" ")}
      />
    </button>
  );
}
