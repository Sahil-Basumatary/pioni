import InfoTip from "../onboarding/InfoTip";
import type { GlossaryTermId } from "../onboarding/glossary";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  radius,
  prefix,
  tip,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  radius: string;
  prefix?: string;
  tip?: GlossaryTermId;
}) {
  return (
    <label
      className={`relative flex h-10 min-w-0 flex-1 flex-col justify-end bg-[rgba(104,107,130,0.08)] px-3 hover:bg-[rgba(104,107,130,0.12)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--text-primary)] ${
        tip ? "overflow-visible" : "overflow-hidden"
      } ${radius}`}
    >
      <span
        className={`absolute left-3 top-1 z-[1] text-xs font-normal text-[rgb(104,107,130)] ${
          tip ? "" : "pointer-events-none"
        }`}
      >
        {tip ? (
          <InfoTip term={tip} label={label} className="text-xs font-normal" />
        ) : (
          label
        )}
      </span>
      <span className="flex min-w-0 items-baseline gap-0.5 pb-1 pt-4">
        {prefix ? (
          <span className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
            {prefix}
          </span>
        ) : null}
        <input
          inputMode="decimal"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm font-medium tabular-nums text-[var(--text-primary)] outline-none placeholder:text-[rgb(104,107,130)]"
        />
      </span>
    </label>
  );
}

export function DetailRow({
  label,
  value,
  labelUnderline = false,
  tip,
}: {
  label: string;
  value: string;
  labelUnderline?: boolean;
  tip?: GlossaryTermId;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      {tip ? (
        <InfoTip term={tip} label={label} />
      ) : (
        <span
          className={`text-[rgb(104,107,130)] ${
            labelUnderline
              ? "underline decoration-dashed underline-offset-4"
              : ""
          }`}
        >
          {label}
        </span>
      )}
      <span className="tabular-nums font-medium text-[rgb(72,75,94)]">
        {value}
      </span>
    </div>
  );
}

export function TicketCheck({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-flex h-4 w-4 items-center justify-center rounded-[3px] ${
          checked ? "bg-[rgb(113,50,245)]" : "bg-[rgba(104,107,130,0.32)]"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </span>
  );
}

export function ChevronTiny({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
