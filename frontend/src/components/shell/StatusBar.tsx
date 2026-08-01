import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectMarketStatus } from "../../features/market/marketSlice";
import { useLiveMarketTrade } from "../../features/market/liveMarketStore";
import { symbolSelected } from "../../features/instrument/instrumentSlice";
import { useMarketSearch } from "../../features/markets/MarketSearchContext";
import {
  filterMarketRows,
  sortMarketRows,
  useMarketRows,
  type MarketRow,
} from "../../features/markets/useMarketRows";
import { useLanguage } from "../../features/auth/LanguageProvider";
import type { StatusShellMessageKey } from "../../features/i18n/shellStatusCatalog";
import { formatUsd } from "../../utils/formatters";
import type { ConnectionStatus } from "../../hooks/useMarketWebSocket";
import {
  LineChartDownIcon,
  LineChartUpIcon,
  PercentageIcon,
  RocketIcon,
  StarIcon,
} from "./shellIcons";

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-400 animate-pulse",
  disconnected: "bg-red-500",
};

const STATUS_LABEL_KEY: Record<ConnectionStatus, StatusShellMessageKey> = {
  connected: "statusOnline",
  connecting: "statusConnecting",
  disconnected: "statusOffline",
};

type TickerType = "Favorites" | "Gainers" | "Top Traded" | "Losers" | "New";

const TICKER_TYPES: {
  id: TickerType;
  labelKey: StatusShellMessageKey;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "Favorites", labelKey: "tickerFavorites", Icon: StarIcon },
  { id: "Gainers", labelKey: "tickerGainers", Icon: LineChartUpIcon },
  { id: "Top Traded", labelKey: "tickerTopTraded", Icon: PercentageIcon },
  { id: "Losers", labelKey: "tickerLosers", Icon: LineChartDownIcon },
  { id: "New", labelKey: "tickerNew", Icon: RocketIcon },
];

type MenuPos = { top: number; left: number };

export default function StatusBar() {
  const { t } = useLanguage();
  const status = useAppSelector(selectMarketStatus);
  const { favorites } = useMarketSearch();
  const { rows } = useMarketRows(30_000);
  const [tickerType, setTickerType] = useState<TickerType>("Favorites");
  const [showChangePct, setShowChangePct] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const activeType = TICKER_TYPES.find((item) => item.id === tickerType);
  const ActiveIcon = activeType?.Icon ?? StarIcon;
  const statusLabel = t(STATUS_LABEL_KEY[status]);
  const tickerLabel = t(activeType?.labelKey ?? "tickerFavorites");

  const tickers = useMemo(() => {
    if (tickerType === "New") return [];
    const favoritesOnly = tickerType === "Favorites";
    const filtered = filterMarketRows(rows, "", favoritesOnly, favorites);
    const sort =
      tickerType === "Gainers"
        ? "gainers"
        : tickerType === "Losers"
          ? "losers"
          : "volume";
    return sortMarketRows(filtered, sort).slice(0, 12);
  }, [rows, tickerType, favorites]);

  return (
    <footer className="sticky bottom-0 z-40 border-t border-[var(--card-border)] bg-[var(--card-bg)]">
      <div className="mx-auto flex h-9 max-w-[1320px] items-center gap-2 px-4 text-xs text-[var(--text-muted)] lg:px-12">
        <button
          type="button"
          className="rail-icon inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2 text-[11px] font-medium text-emerald-700"
          aria-label={statusLabel}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]} ${
              status === "connecting" ? "" : status === "connected" ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          />
          {statusLabel}
        </button>
        <TickerTypeChip
          label={tickerLabel}
          Icon={ActiveIcon}
          tickerType={tickerType}
          onSelectType={setTickerType}
          showChangePct={showChangePct}
          showPrice={showPrice}
          onToggleChangePct={() => setShowChangePct((v) => !v)}
          onTogglePrice={() => setShowPrice((v) => !v)}
        />
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {tickers.map((row) => (
            <TickerChip
              key={row.symbol}
              row={row}
              showChangePct={showChangePct}
              showPrice={showPrice}
            />
          ))}
          {tickerType === "New" && (
            <span className="truncate text-[11px]">{t("newListingsHint")}</span>
          )}
          {tickerType === "Favorites" && tickers.length === 0 && (
            <span className="truncate text-[11px]">{t("starMarketsHint")}</span>
          )}
          <span className="ml-2 hidden shrink-0 truncate text-[11px] md:inline">
            {t("paperDisclaimer")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <a
            href="mailto:sahil@sahilbasumatary.dev?subject=Pioni%20feedback"
            className="hidden transition-colors hover:text-[var(--text-primary)] sm:inline"
          >
            {t("shareFeedback")}
          </a>
          <a
            href="mailto:sahil@sahilbasumatary.dev?subject=Pioni%20support"
            className="hidden transition-colors hover:text-[var(--text-primary)] md:inline"
          >
            {t("chatWithUs")}
          </a>
          <NavLink
            to="/privacy"
            className="transition-colors hover:text-[var(--text-primary)]"
          >
            {t("privacy")}
          </NavLink>
          <NavLink
            to="/terms"
            className="transition-colors hover:text-[var(--text-primary)]"
          >
            {t("terms")}
          </NavLink>
        </div>
      </div>
    </footer>
  );
}

function TickerTypeChip({
  label,
  Icon,
  tickerType,
  onSelectType,
  showChangePct,
  showPrice,
  onToggleChangePct,
  onTogglePrice,
}: {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  tickerType: TickerType;
  onSelectType: (type: TickerType) => void;
  showChangePct: boolean;
  showPrice: boolean;
  onToggleChangePct: () => void;
  onTogglePrice: () => void;
}) {
  const { t } = useLanguage();
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.top - 4, left: rect.left });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
    const menu = menuRef.current;
    if (!menu) return;
    const height = menu.getBoundingClientRect().height;
    const btn = btnRef.current?.getBoundingClientRect();
    if (btn) setPos({ top: btn.top - height - 4, left: btn.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", placeMenu);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", placeMenu);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="rail-icon inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-black/[0.06] px-2 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[80] min-w-[200px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)]"
          >
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("tickerType")}
            </p>
            {TICKER_TYPES.map(({ id, labelKey, Icon: TypeIcon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectType(id);
                  setOpen(false);
                }}
                className={`rail-icon flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  tickerType === id
                    ? "bg-black/[0.06] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
                }`}
              >
                <TypeIcon className="h-4 w-4" />
                {t(labelKey)}
              </button>
            ))}
            <div className="my-1 border-t border-[var(--card-border)]" />
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("tickerMenuSettings")}
            </p>
            <label className="rail-icon flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-black/[0.04]">
              <span>{t("tickerChangePct")}</span>
              <input
                type="checkbox"
                checked={showChangePct}
                onChange={onToggleChangePct}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
            </label>
            <label className="rail-icon flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-black/[0.04]">
              <span>{t("tickerPrice")}</span>
              <input
                type="checkbox"
                checked={showPrice}
                onChange={onTogglePrice}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
            </label>
          </div>,
          document.body,
        )}
    </>
  );
}

function TickerChip({
  row,
  showChangePct,
  showPrice,
}: {
  row: MarketRow;
  showChangePct: boolean;
  showPrice: boolean;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const trade = useLiveMarketTrade(row.symbol);
  const priceNum = trade ? Number(trade.price) : row.price;
  const price = priceNum != null && Number.isFinite(priceNum) ? formatUsd(priceNum) : null;
  const changePct = row.changePct;
  const pctClass =
    changePct == null
      ? "text-[var(--text-muted)]"
      : changePct >= 0
        ? "text-emerald-600"
        : "text-red-500";
  const pctLabel =
    changePct == null ? null : `${changePct >= 0 ? "" : "-"}${Math.abs(changePct).toFixed(2)}%`;

  return (
    <button
      type="button"
      onClick={() => {
        dispatch(symbolSelected(row.symbol));
        navigate("/trading");
      }}
      className="rail-icon shrink-0 rounded-md px-1.5 py-0.5 tabular-nums hover:bg-black/[0.04]"
    >
      <span className="font-medium text-[var(--text-primary)]">{row.label}/USD</span>
      {showPrice && price && (
        <span className="ml-1 text-[var(--text-primary)]">{price}</span>
      )}
      {showChangePct && pctLabel && (
        <span className={`ml-1 ${pctClass}`}>{pctLabel}</span>
      )}
    </button>
  );
}
