import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectSymbol } from "../instrument/instrumentSlice";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import {
  useGetMyPortfolioQuery,
  useGetMyPositionsQuery,
} from "../portfolio/portfolioApi";
import { useSubmitOrderMutation, useGetOrderBookQuery, type OrderSide, type OrderType } from "./ordersApi";
import { evaluateOrder } from "./orderValidation";
import type { TradingVenue } from "../trading/tradingVenue";
import { ChevronDownSmallIcon } from "../../components/shell/shellIcons";
import { baseAsset } from "../../components/shell/activityFormat";
import { paperFees } from "../trading/paperFees";
import { useToast } from "../toasts/useToast";
import { toastFromOrder } from "../toasts/orderToastCopy";
import { watchOpenOrder } from "../toasts/orderWatch";
import InfoTip from "../onboarding/InfoTip";
import {
  ChevronTiny,
  DetailRow,
  Field,
  TicketCheck,
} from "./ticketControls";
import { readDisplayPrefs, formatPrefLimitPrice } from "../settings/displayPrefs";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import { useLanguage } from "../auth/LanguageProvider";
import type { TradeShellMessageKey } from "../i18n/shellTradeCatalog";

function parseDecimal(raw: string): number {
  const cleaned = String(raw).replace(/,/g, "").trim();
  if (!cleaned) return NaN;
  return Number(cleaned);
}

function formatLimitPrice(n: number): string {
  return formatPrefLimitPrice(n);
}

function extractError(err: unknown): string | null {
  const detail = (err as { data?: { detail?: { message?: string } } })?.data?.detail;
  if (detail?.message) return detail.message;
  return null;
}

function formatQtyInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1) return n.toFixed(6).replace(/\.?0+$/, "");
  return n.toFixed(8).replace(/\.?0+$/, "");
}

function formatTotalInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(2);
}

type Feedback = { tone: "success" | "error"; message: string };
type TimeInForce = "GTC" | "IOC";

const ADVANCED_TYPES: {
  id: string;
  labelKey: TradeShellMessageKey;
}[] = [
  { id: "stop-loss", labelKey: "tradeStopLoss" },
  { id: "take-profit", labelKey: "tradeTakeProfit" },
  { id: "trailing-stop", labelKey: "tradeTrailingStop" },
];

// FOK is not offered: the engine cancels an unfilled remainder but does not reject a partial
// fill, which is IOC behaviour, not fill-or-kill.
const TIF_OPTIONS: { id: TimeInForce; labelKey: TradeShellMessageKey }[] = [
  { id: "GTC", labelKey: "tradeTifGtc" },
  { id: "IOC", labelKey: "tradeTifIoc" },
];

const MARGIN_LEVERAGE_OPTIONS = [2, 3, 4, 5, 10] as const;
const FUTURES_LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100] as const;
const DEFAULT_MARGIN_LEVERAGE = 10;
const DEFAULT_FUTURES_LEVERAGE = 100;

export default function OrderTicket({
  venue = "spot",
}: {
  venue?: TradingVenue;
}) {
  const isMargin = venue === "margin";
  const isFutures = venue === "futures";
  const isDeriv = isMargin || isFutures;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const symbol = useAppSelector(selectSymbol);
  const trade = useLiveMarketTrade(symbol);
  const livePrice = trade ? Number(trade.price) : null;
  const { data: book } = useGetOrderBookQuery(
    { symbol, depth: 1 },
    { pollingInterval: 5_000 },
  );
  const bookMid = useMemo(() => {
    const bid = book?.best_bid != null ? Number(book.best_bid) : null;
    const ask = book?.best_ask != null ? Number(book.best_ask) : null;
    if (
      bid != null &&
      ask != null &&
      Number.isFinite(bid) &&
      Number.isFinite(ask)
    ) {
      return (bid + ask) / 2;
    }
    return null;
  }, [book]);
  const referencePrice = livePrice ?? bookMid;
  const { data: portfolio } = useGetMyPortfolioQuery(undefined, {
    skip: !isSignedIn,
  });
  const { data: positions } = useGetMyPositionsQuery(
    { openOnly: true },
    { skip: !isSignedIn },
  );
  const cashBalance = portfolio ? Number(portfolio.cash_balance) : null;
  const baseQty = useMemo(() => {
    const row = (positions ?? []).find(
      (p) => p.symbol.toUpperCase() === symbol.toUpperCase(),
    );
    return row ? Number(row.quantity) : 0;
  }, [positions, symbol]);
  const [side, setSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>(
    () => readDisplayPrefs().defaultOrderType,
  );
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [total, setTotal] = useState("");
  const [sizePct, setSizePct] = useState(0);
  const [tpSl, setTpSl] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(isDeriv);
  const [statusDeclared, setStatusDeclared] = useState(false);
  const [derivativesUnlocked, setDerivativesUnlocked] = useState(false);
  const [leverage, setLeverage] = useState<number>(
    isFutures ? DEFAULT_FUTURES_LEVERAGE : DEFAULT_MARGIN_LEVERAGE,
  );
  const [leverageOpen, setLeverageOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [tif, setTif] = useState<TimeInForce>("GTC");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedNoteKey, setAdvancedNoteKey] =
    useState<TradeShellMessageKey | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();
  const toast = useToast();
  const advancedRef = useRef<HTMLDivElement>(null);
  const leverageRef = useRef<HTMLDivElement>(null);
  const advancedMenuId = useId();
  const leverageMenuId = useId();
  const evaluation = evaluateOrder({
    side,
    orderType,
    quantity,
    limitPrice,
    livePrice,
    cashBalance: isSignedIn ? cashBalance : null,
  });
  const asset = baseAsset(symbol);
  const isBuy = side === "BUY";
  const submitLabel = isFutures
    ? t(isBuy ? "tradeSubmitLongFutures" : "tradeSubmitShortFutures", {
        asset,
      })
    : isMargin
      ? t(isBuy ? "tradeSubmitLongMargin" : "tradeSubmitShortMargin", {
          asset,
          leverage: String(leverage),
        })
      : t(isBuy ? "tradeSubmitBuyAsset" : "tradeSubmitSellAsset", { asset });
  const tpSlDisabled = isMargin && !statusDeclared;
  const reduceOnlyLocked = isMargin && !statusDeclared;
  const leverageOptions = isFutures
    ? FUTURES_LEVERAGE_OPTIONS
    : MARGIN_LEVERAGE_OPTIONS;
  const effectivePrice =
    orderType === "LIMIT"
      ? parseDecimal(limitPrice) || null
      : referencePrice;
  const needsFunds =
    isSignedIn &&
    isBuy &&
    cashBalance != null &&
    cashBalance <= 0;
  const estFeeUsd = 0;
  const qtyNum = parseDecimal(quantity);
  const notional =
    effectivePrice != null &&
    Number.isFinite(qtyNum) &&
    qtyNum > 0 &&
    effectivePrice > 0
      ? qtyNum * effectivePrice
      : null;
  const requiredMargin =
    isDeriv && notional != null ? notional / leverage : null;
  const marginHealth =
    requiredMargin == null
      ? "-%"
      : cashBalance == null
        ? "-%"
        : cashBalance >= requiredMargin
          ? t("tradeHealthy")
          : t("tradeAtRisk");
  const requiredMarginDisplay =
    requiredMargin == null
      ? isFutures
        ? "0.00 USD"
        : "—"
      : `${requiredMargin.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD`;
  const availableLabel = isFutures
    ? t("tradeAvailableBalance")
    : t("tradeAvailableToTrade");
  const relatedBalancePlain = isBuy
    ? cashBalance != null
      ? `${cashBalance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD`
      : "—"
    : String(baseQty || 0);

  useEffect(() => {
    setLimitPrice("");
    setQuantity("");
    setTotal("");
    setSizePct(0);
  }, [symbol]);

  useEffect(() => {
    if (orderType !== "LIMIT") return;
    if (referencePrice == null || !Number.isFinite(referencePrice)) return;
    setLimitPrice((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return formatLimitPrice(referencePrice);
      // Migrate old locale-formatted values (e.g. "65,146.3") so Number() works.
      if (trimmed.includes(",")) return trimmed.replace(/,/g, "");
      return prev;
    });
  }, [referencePrice, orderType, symbol]);

  useEffect(() => {
    if (orderType === "MARKET") setPostOnly(false);
  }, [orderType]);

  useEffect(() => {
    if (!advancedOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!advancedRef.current?.contains(event.target as Node)) {
        setAdvancedOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAdvancedOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [advancedOpen]);

  useEffect(() => {
    if (!leverageOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!leverageRef.current?.contains(event.target as Node)) {
        setLeverageOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLeverageOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [leverageOpen]);

  function syncFromQuantity(nextQty: string, price: number | null) {
    setQuantity(nextQty);
    const q = parseDecimal(nextQty);
    if (price != null && price > 0 && Number.isFinite(q) && q > 0) {
      setTotal(formatTotalInput(q * price));
    } else {
      setTotal("");
    }
  }

  function syncFromTotal(nextTotal: string, price: number | null) {
    setTotal(nextTotal);
    const t = parseDecimal(nextTotal);
    if (price != null && price > 0 && Number.isFinite(t) && t > 0) {
      setQuantity(formatQtyInput(t / price));
    } else if (!nextTotal.trim()) {
      setQuantity("");
    }
  }

  function applySizePct(pct: number) {
    setSizePct(pct);
    const price = effectivePrice;
    if (price == null || price <= 0) return;
    if (isBuy) {
      if (cashBalance == null || cashBalance <= 0) return;
      const spend = (cashBalance * pct) / 100;
      syncFromQuantity(formatQtyInput(spend / price), price);
      return;
    }
    if (baseQty <= 0) return;
    syncFromQuantity(formatQtyInput((baseQty * pct) / 100), price);
  }

  async function handleSubmit() {
    setFeedback(null);
    const prefs = readDisplayPrefs();
    if (prefs.confirmOrders) {
      const ok = window.confirm(
        t("tradeConfirmSubmit", {
          side: side.toLowerCase(),
          orderType: orderType.toLowerCase(),
          quantity: quantity || "0",
          asset,
        }),
      );
      if (!ok) return;
    }
    try {
      const order = await submitOrder({
        symbol,
        side,
        order_type: orderType,
        time_in_force: tif,
        quantity,
        ...(orderType === "LIMIT"
          ? { price: String(limitPrice).replace(/,/g, "") }
          : {}),
      }).unwrap();
      const filled = order.status === "FILLED";
      setFeedback({
        tone: "success",
        message: filled
          ? `Filled — ${isDeriv ? (isBuy ? "longed" : "shorted") : isBuy ? "bought" : "sold"} ${order.filled_quantity} ${asset}`
          : `Order placed (${order.status.toLowerCase().replace(/_/g, " ")})`,
      });
      toast(toastFromOrder(order));
      watchOpenOrder(order.id, order.status);
      setQuantity("");
      setTotal("");
      setSizePct(0);
      setTpSl(false);
      setPostOnly(false);
      setReduceOnly(isDeriv);
    } catch (err) {
      const message = extractError(err) ?? t("tradeOrderErrorFallback");
      setFeedback({ tone: "error", message });
      toast({ title: message, tone: "negative" });
    }
  }

  function goMargin() {
    navigate("/trade/margin");
  }

  function goSpot() {
    navigate("/trading");
  }

  return (
    <div
      data-tour="order-ticket"
      className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-x-hidden overflow-y-auto bg-[var(--card-bg)] p-2"
    >
      {isMargin && !statusDeclared && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[rgba(104,107,130,0.04)] p-3">
          <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
            {t("tradeDeclareStatusBlurb")}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatusDeclared(true)}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white hover:bg-[rgb(32,32,32)]"
            >
              {t("tradeDeclareStatus")}
            </button>
            <button
              type="button"
              onClick={goSpot}
              className="rail-icon inline-flex h-9 shrink-0 items-center whitespace-nowrap !bg-[rgba(104,107,130,0.08)] px-3 py-2 text-sm font-medium leading-5 text-[var(--text-primary)] hover:!bg-[rgba(104,107,130,0.12)] rounded-xl"
            >
              {t("tradeTradeSpotInstead")}
            </button>
          </div>
        </div>
      )}
      {isFutures && !derivativesUnlocked && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[rgba(104,107,130,0.04)] p-3">
          <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
            {t("tradeDerivativesBlurb")}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDerivativesUnlocked(true)}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white hover:bg-[rgb(32,32,32)]"
            >
              {t("tradeUnlockDerivatives")}
            </button>
            <button
              type="button"
              onClick={goSpot}
              className="rail-icon inline-flex h-9 shrink-0 items-center whitespace-nowrap !bg-[rgba(104,107,130,0.08)] px-3 py-2 text-sm font-medium leading-5 text-[var(--text-primary)] hover:!bg-[rgba(104,107,130,0.12)] rounded-xl"
            >
              {t("tradeTradeSpotInstead")}
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
      <div className="grid flex-1 grid-cols-2 rounded-lg bg-[rgba(104,107,130,0.08)] p-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={isBuy}
            onClick={() => setSide("BUY")}
            className={`rail-icon rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              isBuy
                ? "!bg-[rgba(20,158,97,0.24)] !text-[#08844f] hover:!bg-[rgba(20,158,97,0.28)]"
                : "!bg-transparent !text-[rgb(104,107,130)]"
            }`}
          >
            {isDeriv ? t("tradeLong") : t("tradeBuy")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isBuy}
            onClick={() => setSide("SELL")}
            className={`rail-icon rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              !isBuy
                ? "!bg-[rgba(245,57,94,0.24)] !text-[#d11d45] hover:!bg-[rgba(245,57,94,0.28)]"
                : "!bg-transparent !text-[rgb(104,107,130)]"
            }`}
          >
            {isDeriv ? t("tradeShort") : t("tradeSell")}
          </button>
        </div>
        {isFutures ? (
          <div className="relative flex shrink-0 items-center" ref={leverageRef}>
            <div className="flex h-8 items-center rounded-xl bg-[rgba(148,151,169,0.08)] px-2">
              <button
                type="button"
                aria-label={t("tradeCrossNx", { leverage: String(leverage) })}
                aria-haspopup="menu"
                aria-expanded={leverageOpen}
                aria-controls={leverageMenuId}
                onClick={() => setLeverageOpen((v) => !v)}
                className="rail-icon inline-flex items-center gap-0.5 text-xs font-medium leading-4 text-[rgb(72,75,94)]"
              >
                {t("tradeCrossNx", { leverage: String(leverage) })}
                <ChevronDownSmallIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            {leverageOpen && (
              <div
                id={leverageMenuId}
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 min-w-[5.5rem] overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                {leverageOptions.map((x) => (
                  <button
                    key={x}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLeverage(x);
                      setLeverageOpen(false);
                    }}
                    className={`rail-icon flex w-full px-3 py-1.5 text-left text-xs ${
                      leverage === x
                        ? "!bg-black/[0.06] font-semibold text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-black/[0.04]"
                    }`}
                  >
                    {x}x
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex shrink-0 items-center gap-1.5" ref={leverageRef}>
            <label className="relative inline-flex h-4 cursor-pointer items-center">
              <input
                type="checkbox"
                role="switch"
                aria-label={t("tradeEnableMargin")}
                className="sr-only"
                checked={isMargin}
                onChange={(e) => {
                  if (e.target.checked) goMargin();
                  else goSpot();
                }}
              />
              <span
                className={`relative inline-flex h-4 w-6 shrink-0 items-center rounded-full transition-colors ${
                  isMargin ? "bg-[#149e61]" : "bg-[rgba(104,107,130,0.32)]"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-2.5 w-2.5 rounded-full bg-white transition-[left] ${
                    isMargin ? "left-[11px]" : "left-0.5"
                  }`}
                />
              </span>
            </label>
            <button
              type="button"
              aria-label={t("tradeMarginNx", { leverage: String(leverage) })}
              aria-haspopup="menu"
              aria-expanded={leverageOpen}
              aria-controls={leverageMenuId}
              onClick={() => {
                if (!isMargin) {
                  goMargin();
                  return;
                }
                setLeverageOpen((v) => !v);
              }}
              className={`rail-icon inline-flex items-center gap-0.5 text-xs font-medium leading-4 ${
                isMargin ? "text-[#149e61]" : "text-[rgb(72,75,94)]"
              }`}
              style={isMargin ? { color: "rgb(20, 158, 97)" } : undefined}
            >
              {t("tradeMarginNx", { leverage: String(leverage) })}
              <ChevronDownSmallIcon className="h-3.5 w-3.5" />
            </button>
            {leverageOpen && isMargin && (
              <div
                id={leverageMenuId}
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 min-w-[5.5rem] overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                {leverageOptions.map((x) => (
                  <button
                    key={x}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLeverage(x);
                      setLeverageOpen(false);
                    }}
                    className={`rail-icon flex w-full px-3 py-1.5 text-left text-xs ${
                      leverage === x
                        ? "!bg-black/[0.06] font-semibold text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-black/[0.04]"
                    }`}
                  >
                    {x}x
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative flex items-center gap-3 text-xs font-medium" ref={advancedRef}>
        {(["LIMIT", "MARKET"] as const).map((type) => {
          const active = orderType === type && !advancedNoteKey;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={active}
              key={type}
              onClick={() => {
                setOrderType(type);
                setAdvancedNoteKey(null);
              }}
              className={`rail-icon border-b border-transparent py-1.5 transition-colors ${
                active
                  ? "!border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
              }`}
            >
              {type === "MARKET" ? t("tradeMarket") : t("tradeLimit")}
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-label={t("tradeAdvanced")}
          aria-haspopup="menu"
          aria-expanded={advancedOpen}
          aria-controls={advancedMenuId}
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`rail-icon inline-flex items-center gap-0.5 border-b border-transparent py-1.5 transition-colors ${
            advancedOpen || advancedNoteKey
              ? "!border-[var(--text-primary)] text-[var(--text-primary)]"
              : "text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
          }`}
        >
          {t("tradeAdvanced")}
          <ChevronTiny open={advancedOpen} />
        </button>
        {advancedOpen && (
          <div
            id={advancedMenuId}
            role="menu"
            className="absolute left-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            {ADVANCED_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAdvancedNoteKey(item.labelKey);
                  setAdvancedOpen(false);
                }}
                className="rail-icon flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                {t(item.labelKey)}
                <span className="text-[10px] text-[var(--text-muted)]">{t("tradeSoon")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {advancedNoteKey && (
        <p className="rounded-lg bg-black/[0.04] px-3 py-2 text-xs text-[var(--text-muted)]">
          {t("tradeAdvancedSoon", { type: t(advancedNoteKey) })}
        </p>
      )}
      {orderType === "LIMIT" ? (
        <div className="flex flex-col gap-0.5">
          <Field
            label={t("tradeLimitPriceUsd")}
            tip="limit_order"
            value={limitPrice}
            onChange={(v) => {
              setLimitPrice(v);
              const price = parseDecimal(v);
              const q = parseDecimal(quantity);
              if (Number.isFinite(price) && price > 0 && Number.isFinite(q) && q > 0) {
                setTotal(formatTotalInput(q * price));
              }
            }}
            placeholder="0.00"
            radius="rounded-t-xl rounded-b-sm"
          />
          <div className="flex gap-1">
            <Field
              label={t("tradeQuantityAsset", { asset })}
              value={quantity}
              onChange={(v) =>
                syncFromQuantity(v, effectivePrice != null
                  ? effectivePrice
                  : parseDecimal(limitPrice) || null)
              }
              placeholder="0.00"
              radius="rounded-bl-xl rounded-tr-sm"
            />
            <Field
              label={t("tradeTotalUsd")}
              value={total}
              onChange={(v) =>
                syncFromTotal(v, effectivePrice != null
                  ? effectivePrice
                  : parseDecimal(limitPrice) || null)
              }
              placeholder="0.00"
              prefix={total.trim() ? "≈" : undefined}
              radius="rounded-br-xl rounded-tl-sm"
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          <Field
            label={t("tradeQuantityAsset", { asset })}
            tip="market_order"
            value={quantity}
            onChange={(v) => syncFromQuantity(v, effectivePrice)}
            placeholder="0.00"
            radius="rounded-xl rounded-tr-sm rounded-br-sm"
          />
          <Field
            label={t("tradeTotalUsd")}
            value={total}
            onChange={(v) => syncFromTotal(v, effectivePrice)}
            placeholder="0.00"
            prefix={total.trim() ? "≈" : undefined}
            radius="rounded-xl rounded-tl-sm rounded-bl-sm"
          />
        </div>
      )}
      <div className="flex flex-col gap-1 pt-1">
        <div className="relative flex h-2 items-center">
          <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-[rgba(104,107,130,0.24)]" />
          <div
            className="pointer-events-none absolute left-0 h-1 rounded-full bg-[rgb(104,107,130)]"
            style={{ width: `${sizePct}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sizePct}
            onChange={(e) => applySizePct(Number(e.target.value))}
            className="ticket-size-slider relative z-[1]"
            aria-label={t("tradeOrderSizePct")}
          />
        </div>
        <div className="relative mb-0.5 h-4">
          <span
            className="pointer-events-none absolute top-0 -translate-x-1/2 text-[10px] leading-4 tabular-nums text-[var(--text-muted)]"
            style={{
              left: `clamp(0.75rem, ${sizePct}%, calc(100% - 0.75rem))`,
            }}
          >
            {sizePct}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <InfoTip term="available_to_trade" label={availableLabel} />
        <span className="flex items-center gap-1 tabular-nums text-[var(--text-primary)]">
          {isSignedIn && (
            <Link
              to="/deposit"
              className="rail-icon inline-flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(104,107,130,0.32)] text-[11px] leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label={t("tradeAddFunds")}
              title={t("tradeAddFunds")}
            >
              +
            </Link>
          )}
          <span
            className="text-xs tabular-nums text-[var(--text-primary)]"
            title={isSignedIn ? relatedBalancePlain : undefined}
          >
            {!isSignedIn ? (
              "—"
            ) : isBuy ? (
              relatedBalancePlain
            ) : (
              <>
                {relatedBalancePlain}
                <span className="ms-0.5 text-[rgb(104,107,130)]">{asset}</span>
              </>
            )}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <div
          className={`inline-flex items-center gap-2 text-xs ${
            tpSlDisabled
              ? "text-[var(--text-muted)]"
              : "text-[var(--text-primary)]"
          }`}
        >
          <TicketCheck
            checked={tpSl}
            disabled={tpSlDisabled}
            onChange={setTpSl}
            label={t("tradeTpSl")}
          />
          <InfoTip term="tp_sl" label={t("tradeTpSl")} />
        </div>
        <div
          className={`inline-flex items-center gap-2 text-xs ${
            orderType === "LIMIT"
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          <TicketCheck
            checked={postOnly}
            disabled={orderType !== "LIMIT"}
            onChange={setPostOnly}
            label={t("tradePostOnly")}
          />
          <InfoTip term="post_only" label={t("tradePostOnly")} />
        </div>
        {(isMargin || isFutures) && (
          <div
            className={`inline-flex items-center gap-2 text-xs ${
              reduceOnlyLocked
                ? "text-[var(--text-muted)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            <TicketCheck
              checked={reduceOnly}
              disabled={reduceOnlyLocked}
              onChange={setReduceOnly}
              label={t("tradeReduceOnly")}
            />
            <InfoTip term="reduce_only" label={t("tradeReduceOnly")} />
          </div>
        )}
      </div>
      {tpSl && !tpSlDisabled && (
        <p className="px-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
          {t("tradeTpSlDisplayOnly")}
        </p>
      )}
      {postOnly && orderType === "LIMIT" && (
        <p className="px-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
          {t("tradePostOnlyDisplayOnly")}
        </p>
      )}
      {reduceOnly && !reduceOnlyLocked && (
        <p className="px-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
          {t("tradeReduceOnlyDisplayOnly")}
        </p>
      )}
      {!isSignedIn ? (
        <Link
          to={SIGN_UP_PATH}
          className="mt-auto flex h-10 min-h-10 w-full shrink-0 items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] px-3 py-2.5 text-sm font-medium leading-5 text-[#101114] hover:bg-[rgba(104,107,130,0.12)]"
        >
          {t("tradeSignUpToTrade")}
        </Link>
      ) : needsFunds ? (
        <Link
          to="/deposit"
          className="mt-auto flex h-9 min-h-9 shrink-0 items-center justify-center rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white transition-colors hover:bg-[rgb(32,32,32)]"
        >
          {t("tradeAddUsdToTrade")}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !evaluation.canSubmit}
          title={
            !evaluation.canSubmit && evaluation.reasonKey
              ? t(evaluation.reasonKey)
              : undefined
          }
          className={`mt-auto flex h-9 min-h-9 shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium leading-5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBuy
              ? "!bg-[#08844f] hover:!bg-[#077043]"
              : "!bg-[#d11d45] hover:!bg-[#b9183c]"
          }`}
        >
          {isLoading ? t("tradePlacing") : submitLabel}
        </button>
      )}
      {isSignedIn && !evaluation.canSubmit && evaluation.reasonKey ? (
        <p className="text-xs text-[rgb(104,107,130)]">{t(evaluation.reasonKey)}</p>
      ) : null}
      <div className="min-w-0">
        <button
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
          className="rail-icon flex w-full items-center py-2 text-left text-xs font-medium text-[rgb(104,107,130)] hover:opacity-80"
        >
          {t("tradeOrderDetails")}
          <span className="ms-auto flex shrink-0 items-center text-[var(--text-muted)]">
            <ChevronTiny open={detailsOpen} />
          </span>
        </button>
        {detailsOpen && (
          <div className="flex min-w-0 flex-col gap-2.5 pb-1">
            {isDeriv && (
              <>
                <DetailRow
                  label={t("tradeRequiredMargin")}
                  value={requiredMarginDisplay}
                  tip="required_margin"
                />
                {isMargin && (
                  <DetailRow
                    label={t("tradeMarginHealth")}
                    value={marginHealth}
                    tip="margin_health"
                  />
                )}
                {isFutures && (
                  <DetailRow
                    label={t("tradeEstLiquidation")}
                    value="—"
                    tip="liquidation"
                  />
                )}
              </>
            )}
            <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
              <InfoTip term="time_in_force" label={t("tradeTimeInForce")} />
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value as TimeInForce)}
                aria-label={t("tradeTimeInForce")}
                className="min-w-0 max-w-[11rem] cursor-pointer appearance-none border-0 bg-transparent py-0.5 text-right text-xs font-medium text-[rgb(72,75,94)] outline-none"
              >
                {TIF_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            {isFutures ? (
              <DetailRow
                label={t("tradeEstTradingFee")}
                tip="trading_fee"
                value={
                  notional != null
                    ? `${(notional * 0.0002).toLocaleString("en-US", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })} USD`
                    : "0.00 USD"
                }
              />
            ) : (
              <>
                <DetailRow
                  label={t("tradeEstTradingFee")}
                  tip="trading_fee"
                  value={`${estFeeUsd.toFixed(10).replace(/\.?0+$/, "") || "0"} ${asset}`}
                />
                <div className="flex items-center justify-between text-xs">
                  <InfoTip term="maker_fee" label={t("tradeYourMakerFee")} />
                  <span className="tabular-nums font-medium text-[rgb(72,75,94)]">
                    {paperFees(venue).maker}
                  </span>
                </div>
              </>
            )}
            {isMargin && <DetailRow label={t("tradeEstMarginFee")} value="—" />}
            {!isFutures && (
              <p className="text-[10px] text-[var(--text-muted)]">
                {tif === "GTC" ? t("tradePaperGtcHint") : t("tradePaperIocHint")}
              </p>
            )}
          </div>
        )}
      </div>
      {feedback && (
        <p
          className={`text-xs ${
            feedback.tone === "success" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {feedback.message}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
        {isDeriv
          ? t("tradePracticeDeriv", { leverage: String(leverage) })
          : t("tradePracticeSpot")}
      </p>
    </div>
  );
}
