import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDownSmallIcon,
  SettingsSliderHorizontalIcon,
} from "../../components/shell/shellIcons";
import { useLanguage } from "../auth/LanguageProvider";
import type { MessageKey } from "../i18n/translate";

export type MobileTradeTab = {
  id: string;
  labelKey: MessageKey;
};

type MobileTradeTabsProps = {
  tabs: MobileTradeTab[];
  activeId: string;
  onChange: (id: string) => void;
};

const WIDGET_TOGGLES = [
  { id: "open-trigger-orders", labelKey: "tradeToggleOpenTriggerOrders" },
  { id: "open-positions", labelKey: "tradeToggleOpenPositions" },
  { id: "futures-liquidation", labelKey: "tradeToggleFuturesLiq" },
  { id: "order-form-preview", labelKey: "tradeToggleOrderFormPreview" },
  { id: "price-alerts", labelKey: "tradeTogglePriceAlerts" },
  { id: "trade-history", labelKey: "tradeToggleTradeHistory" },
] as const;

const SELECT_GROUPS = [
  {
    id: "drawings",
    labelKey: "tradeDrawings",
    options: [
      { id: "arrows", labelKey: "tradeDrawArrows" },
      { id: "circles", labelKey: "tradeDrawCircles" },
    ],
  },
  {
    id: "engine",
    labelKey: "tradeChartEngine",
    options: [
      { id: "advanced", labelKey: "tradeEngineAdvancedChart" },
      { id: "simple", labelKey: "tradeEngineSimpleChart" },
    ],
  },
  {
    id: "futures",
    labelKey: "tradeFuturesPrices",
    options: [
      { id: "trade", labelKey: "tradePriceTrade" },
      { id: "mark", labelKey: "tradePriceMark" },
    ],
  },
] as const satisfies readonly {
  id: string;
  labelKey: MessageKey;
  options: readonly { id: string; labelKey: MessageKey }[];
}[];

type SelectId = (typeof SELECT_GROUPS)[number]["id"];

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-2 rounded-lg p-2 text-start hover:bg-black/[0.04]"
    >
      <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
      <span
        role="switch"
        aria-label={label}
        aria-checked={checked}
        className={`relative inline-flex h-4 w-6 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[#23ba75]" : "bg-[rgba(104,107,130,0.32)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left] ${
            checked ? "left-2" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function MobileTradeOptionsMenu() {
  const { t } = useLanguage();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WIDGET_TOGGLES.map((item) => [item.id, true])),
  );
  const [selects, setSelects] = useState<Record<SelectId, string>>({
    drawings: "arrows",
    engine: "advanced",
    futures: "trade",
  });
  const [openSelect, setOpenSelect] = useState<SelectId | null>(null);

  return (
    <div
      role="menu"
      className="absolute right-2 top-8 z-30 max-h-[min(564px,70vh)] min-w-[280px] overflow-auto rounded-xl border border-[rgba(104,107,130,0.08)] bg-[var(--card-bg)] p-1 shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
    >
      <ul className="min-w-[280px]">
        <li className="flex gap-2 p-2">
          <div className="w-full text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-muted)]">
            {t("tradeWidgetSettings")}
          </div>
        </li>
        {WIDGET_TOGGLES.map((item) => (
          <li key={item.id}>
            <ToggleSwitch
              label={t(item.labelKey)}
              checked={toggles[item.id] ?? true}
              onChange={(next) =>
                setToggles((prev) => ({ ...prev, [item.id]: next }))
              }
            />
          </li>
        ))}
        {SELECT_GROUPS.map((group) => (
          <li key={group.id} className="px-2 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-muted)]">
              {t(group.labelKey)}
            </p>
            <div className="relative mt-1 inline-flex flex-col">
              <button
                type="button"
                aria-expanded={openSelect === group.id}
                aria-haspopup="listbox"
                onClick={() =>
                  setOpenSelect((cur) => (cur === group.id ? null : group.id))
                }
                className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-xs font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                {t(
                  group.options.find((option) => option.id === selects[group.id])
                    ?.labelKey ?? group.options[0].labelKey,
                )}
                <ChevronDownSmallIcon className="h-3 w-3 text-[var(--text-muted)]" />
              </button>
              {openSelect === group.id && (
                <ul
                  role="listbox"
                  className="absolute left-0 top-full z-40 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-[rgba(104,107,130,0.08)] bg-[var(--card-bg)] py-1 shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                >
                  {group.options.map((option) => {
                    const selected = selects[group.id] === option.id;
                    return (
                      <li key={option.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelects((prev) => ({
                              ...prev,
                              [group.id]: option.id,
                            }));
                            setOpenSelect(null);
                          }}
                          className={`flex w-full px-3 py-1.5 text-start text-xs font-medium hover:bg-black/[0.04] ${
                            selected
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {t(option.labelKey)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileTradeTabs({ tabs, activeId, onChange }: MobileTradeTabsProps) {
  const { t } = useLanguage();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOptionsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [optionsOpen]);

  return (
    <div ref={rootRef} className="relative mb-2 mt-1 flex min-h-min overflow-hidden pr-2">
      <div className="relative mx-2 min-w-0 flex-1 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors bg-[rgba(104,107,130,0.08)] ${
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label={t("tradeOptions")}
        aria-expanded={optionsOpen}
        onClick={() => setOptionsOpen((v) => !v)}
        className="rail-icon mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(104,107,130,0.08)] text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
      >
        <SettingsSliderHorizontalIcon className="h-4 w-4" />
      </button>
      {optionsOpen && <MobileTradeOptionsMenu />}
    </div>
  );
}

export function MobilePanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--card-bg)]">
      {children}
    </div>
  );
}
