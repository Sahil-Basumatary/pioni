import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
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

function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
}

function formatLimitPrice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 100) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return String(n);
}

function extractError(err: unknown): string {
  const detail = (err as { data?: { detail?: { message?: string } } })?.data?.detail;
  if (detail?.message) return detail.message;
  return "Something went wrong placing your order. Please try again.";
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
type TimeInForce = "GTC" | "IOC" | "FOK";

const ADVANCED_TYPES = [
  { id: "stop-loss", label: "Stop loss" },
  { id: "take-profit", label: "Take profit" },
  { id: "trailing-stop", label: "Trailing stop" },
] as const;

const TIF_OPTIONS: { id: TimeInForce; label: string; ready: boolean }[] = [
  { id: "GTC", label: "Good till canceled", ready: true },
  { id: "IOC", label: "Immediate or cancel", ready: false },
  { id: "FOK", label: "Fill or kill", ready: false },
];

const MARGIN_LEVERAGE_OPTIONS = [2, 3, 4, 5, 10] as const;
const FUTURES_LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100] as const;
const DEFAULT_MARGIN_LEVERAGE = 10;
const DEFAULT_FUTURES_LEVERAGE = 100;
const PAPER_MAKER_FEE = "0.00%";

export default function OrderTicket({
  venue = "spot",
}: {
  venue?: TradingVenue;
}) {
  const isMargin = venue === "margin";
  const isFutures = venue === "futures";
  const isDeriv = isMargin || isFutures;
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
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
  const [orderType, setOrderType] = useState<OrderType>("LIMIT");
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
  const [marginMode] = useState<"Cross" | "Isolated">("Cross");
  const [leverageOpen, setLeverageOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [tif, setTif] = useState<TimeInForce>("GTC");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedNote, setAdvancedNote] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();
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
  const sideLabel = isDeriv
    ? isBuy
      ? "Long"
      : "Short"
    : isBuy
      ? "Buy"
      : "Sell";
  const submitLabel = isFutures
    ? `${sideLabel} (${isBuy ? "buy" : "sell"}) ${asset}`
    : isMargin
      ? `${sideLabel} (${isBuy ? "buy" : "sell"}) ${asset}/USD (${leverage}x)`
      : `${sideLabel} ${asset}/USD`;
  const tpSlDisabled = isMargin && !statusDeclared;
  const reduceOnlyLocked = isMargin && !statusDeclared;
  const leverageOptions = isFutures
    ? FUTURES_LEVERAGE_OPTIONS
    : MARGIN_LEVERAGE_OPTIONS;
  const effectivePrice =
    orderType === "LIMIT"
      ? Number(String(limitPrice).replace(/,/g, "")) || null
      : referencePrice;
  const needsFunds =
    isSignedIn &&
    isBuy &&
    cashBalance != null &&
    cashBalance <= 0;
  const estFeeUsd = 0;
  const qtyNum = Number(quantity);
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
          ? "Healthy"
          : "At risk";
  const requiredMarginDisplay =
    requiredMargin == null
      ? isFutures
        ? "0.00 USD"
        : "—"
      : `${requiredMargin.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD`;
  const availableLabel = isFutures ? "Available balance" : "Available to trade";
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
    setLimitPrice((prev) =>
      prev.trim() ? prev : formatLimitPrice(referencePrice),
    );
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
    const q = Number(nextQty);
    if (price != null && price > 0 && Number.isFinite(q) && q > 0) {
      setTotal(formatTotalInput(q * price));
    } else {
      setTotal("");
    }
  }

  function syncFromTotal(nextTotal: string, price: number | null) {
    setTotal(nextTotal);
    const t = Number(nextTotal);
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
    if (!isSignedIn) {
      openSignIn({});
      return;
    }
    if (needsFunds) return;
    try {
      const order = await submitOrder({
        symbol,
        side,
        order_type: orderType,
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
      setQuantity("");
      setTotal("");
      setSizePct(0);
      setTpSl(false);
      setPostOnly(false);
      setReduceOnly(false);
    } catch (err) {
      setFeedback({ tone: "error", message: extractError(err) });
    }
  }

  function goMargin() {
    navigate("/trade/margin");
  }

  function goSpot() {
    navigate("/trading");
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1.5 overflow-x-hidden overflow-y-auto bg-[var(--card-bg)] p-2.5">
      {isMargin && !statusDeclared && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[rgba(104,107,130,0.04)] p-3">
          <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
            Please declare your investor status to access margin extensions in fiat
            or stablecoins.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatusDeclared(true)}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white hover:bg-[rgb(32,32,32)]"
            >
              Declare status
            </button>
            <button
              type="button"
              className="rail-icon inline-flex h-9 shrink-0 items-center whitespace-nowrap !bg-[rgba(104,107,130,0.08)] px-3 py-2 text-sm font-medium leading-5 text-[var(--text-primary)] hover:!bg-[rgba(104,107,130,0.12)] rounded-xl"
            >
              Sell {asset}/USD {leverage}x
            </button>
          </div>
        </div>
      )}
      {isFutures && !derivativesUnlocked && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[rgba(104,107,130,0.04)] p-3">
          <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
            Derivatives trading is restricted to professional clients. To be
            categorized as a professional client, you must complete an assessment
            and provide supporting documents.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDerivativesUnlocked(true)}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white hover:bg-[rgb(32,32,32)]"
            >
              Unlock derivatives
            </button>
            <button
              type="button"
              className="rail-icon inline-flex h-9 shrink-0 items-center whitespace-nowrap !bg-[rgba(104,107,130,0.08)] px-3 py-2 text-sm font-medium leading-5 text-[var(--text-primary)] hover:!bg-[rgba(104,107,130,0.12)] rounded-xl"
            >
              Learn more
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-2 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={isBuy}
            onClick={() => setSide("BUY")}
            className={`rail-icon rounded-[10px] px-2 py-1.5 text-xs font-medium transition-colors ${
              isBuy
                ? "!bg-[rgba(20,158,97,0.24)] !text-[#08844f] hover:!bg-[rgba(20,158,97,0.28)]"
                : "!bg-transparent !text-[rgb(104,107,130)]"
            }`}
          >
            {isDeriv ? "Long" : "Buy"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isBuy}
            onClick={() => setSide("SELL")}
            className={`rail-icon rounded-[10px] px-2 py-1.5 text-xs font-medium transition-colors ${
              !isBuy
                ? "!bg-[rgba(245,57,94,0.24)] !text-[#d11d45] hover:!bg-[rgba(245,57,94,0.28)]"
                : "!bg-transparent !text-[rgb(104,107,130)]"
            }`}
          >
            {isDeriv ? "Short" : "Sell"}
          </button>
        </div>
        {isFutures ? (
          <div className="relative flex shrink-0 items-center" ref={leverageRef}>
            <button
              type="button"
              aria-label={`${marginMode} ${leverage}x`}
              aria-haspopup="menu"
              aria-expanded={leverageOpen}
              aria-controls={leverageMenuId}
              onClick={() => setLeverageOpen((v) => !v)}
              className="rail-icon inline-flex items-center gap-0.5 text-xs font-medium leading-4 text-[rgb(72,75,94)]"
            >
              {marginMode} {leverage}x
              <ChevronDownSmallIcon className="h-3.5 w-3.5" />
            </button>
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
                aria-label="Enable margin"
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
              aria-label={`Margin ${leverage}x`}
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
              Margin {leverage}x
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
          const active = orderType === type && !advancedNote;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={active}
              key={type}
              onClick={() => {
                setOrderType(type);
                setAdvancedNote(null);
              }}
              className={`rail-icon border-b border-transparent py-1.5 transition-colors ${
                active
                  ? "!border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
              }`}
            >
              {type === "MARKET" ? "Market" : "Limit"}
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-label="Advanced"
          aria-haspopup="menu"
          aria-expanded={advancedOpen}
          aria-controls={advancedMenuId}
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`rail-icon inline-flex items-center gap-0.5 border-b border-transparent py-1.5 transition-colors ${
            advancedOpen || advancedNote
              ? "!border-[var(--text-primary)] text-[var(--text-primary)]"
              : "text-[rgb(104,107,130)] hover:text-[var(--text-primary)]"
          }`}
        >
          Advanced
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
                  setAdvancedNote(item.label);
                  setAdvancedOpen(false);
                }}
                className="rail-icon flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                {item.label}
                <span className="text-[10px] text-[var(--text-muted)]">Soon</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {advancedNote && (
        <p className="rounded-lg bg-black/[0.04] px-3 py-2 text-xs text-[var(--text-muted)]">
          {advancedNote} orders are coming soon — use Limit or Market for now.
        </p>
      )}
      {orderType === "LIMIT" ? (
        <div className="flex flex-col gap-0.5">
          <Field
            label="Limit price USD"
            value={limitPrice}
            onChange={(v) => {
              setLimitPrice(v);
              const price = Number(v.replace(/,/g, ""));
              const q = Number(quantity);
              if (Number.isFinite(price) && price > 0 && Number.isFinite(q) && q > 0) {
                setTotal(formatTotalInput(q * price));
              }
            }}
            placeholder="0.00"
            radius="rounded-t-xl rounded-b-sm"
          />
          <div className="flex gap-1">
            <Field
              label={`Quantity ${asset}`}
              value={quantity}
              onChange={(v) =>
                syncFromQuantity(v, effectivePrice != null
                  ? effectivePrice
                  : Number(limitPrice.replace(/,/g, "")) || null)
              }
              placeholder="0.00"
              radius="rounded-bl-xl rounded-tr-sm"
            />
            <Field
              label="Total USD"
              value={total}
              onChange={(v) =>
                syncFromTotal(v, effectivePrice != null
                  ? effectivePrice
                  : Number(limitPrice.replace(/,/g, "")) || null)
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
            label={`Quantity ${asset}`}
            value={quantity}
            onChange={(v) => syncFromQuantity(v, effectivePrice)}
            placeholder="0.00"
            radius="rounded-xl rounded-tr-sm rounded-br-sm"
          />
          <Field
            label="Total USD"
            value={total}
            onChange={(v) => syncFromTotal(v, effectivePrice)}
            placeholder="0.00"
            prefix={total.trim() ? "≈" : undefined}
            radius="rounded-xl rounded-tl-sm rounded-bl-sm"
          />
        </div>
      )}
      <div className="relative pb-4 pt-1">
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
            aria-label="Order size percent"
          />
        </div>
        <span
          className="pointer-events-none absolute top-7 -translate-x-1/2 text-[10px] tabular-nums text-[var(--text-muted)]"
          style={{ left: `clamp(0.75rem, ${sizePct}%, calc(100% - 0.75rem))` }}
        >
          {sizePct}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-[rgb(104,107,130)] underline decoration-dashed underline-offset-4">
          {availableLabel}
        </span>
        <span className="flex items-center gap-1 tabular-nums text-[var(--text-primary)]">
          <Link
            to="/deposit"
            className="rail-icon inline-flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(104,107,130,0.32)] text-[11px] leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Add funds"
            title="Add funds"
          >
            +
          </Link>
          <button
            type="button"
            aria-label="Order related balance"
            className="rail-icon text-xs tabular-nums text-[var(--text-primary)]"
            title={isSignedIn ? relatedBalancePlain : undefined}
          >
            {isSignedIn ? (
              isBuy ? (
                relatedBalancePlain
              ) : (
                <>
                  {relatedBalancePlain}
                  <span className="ms-0.5 text-[rgb(104,107,130)]">{asset}</span>
                </>
              )
            ) : (
              "—"
            )}
          </button>
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <label
          className={`inline-flex items-center gap-2 text-xs ${
            tpSlDisabled
              ? "cursor-not-allowed text-[var(--text-muted)]"
              : "cursor-pointer text-[var(--text-primary)]"
          }`}
        >
          <TicketCheck
            checked={tpSl}
            disabled={tpSlDisabled}
            onChange={setTpSl}
            label="TP/SL"
          />
          TP/SL
        </label>
        <label
          className={`inline-flex items-center gap-2 text-xs ${
            orderType === "LIMIT"
              ? "cursor-pointer text-[var(--text-primary)]"
              : "cursor-not-allowed text-[var(--text-muted)]"
          }`}
        >
          <TicketCheck
            checked={postOnly}
            disabled={orderType !== "LIMIT"}
            onChange={setPostOnly}
            label="Post only"
          />
          Post only
        </label>
        {(isMargin || isFutures) && (
          <label
            className={`inline-flex items-center gap-2 text-xs ${
              reduceOnlyLocked
                ? "cursor-not-allowed text-[var(--text-muted)]"
                : "cursor-pointer text-[var(--text-primary)]"
            }`}
          >
            <TicketCheck
              checked={reduceOnly}
              disabled={reduceOnlyLocked}
              onChange={setReduceOnly}
              label="Reduce only"
            />
            Reduce only
          </label>
        )}
      </div>
      {tpSl && !tpSlDisabled && (
        <p className="rounded-lg bg-black/[0.04] px-3 py-2 text-xs text-[var(--text-muted)]">
          Take-profit / stop-loss attaches on the next milestone — checkbox is wired for layout parity.
        </p>
      )}
      {postOnly && orderType === "LIMIT" && (
        <p className="text-[11px] text-[var(--text-muted)]">
          Post-only is display-only for now; the matching engine will enforce it later.
        </p>
      )}
      {needsFunds ? (
        <Link
          to="/deposit"
          className="mt-auto flex h-9 min-h-9 shrink-0 items-center justify-center rounded-xl bg-black px-3 py-2 text-sm font-medium leading-5 text-white transition-colors hover:bg-[rgb(32,32,32)]"
        >
          Add USD to trade
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isLoading || (isSignedIn ? !evaluation.canSubmit : !quantity.trim())
          }
          title={
            isSignedIn && !evaluation.canSubmit
              ? evaluation.reason ?? undefined
              : undefined
          }
          className={`mt-auto flex h-9 min-h-9 shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium leading-5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBuy
              ? "!bg-[#08844f] hover:!bg-[#077043]"
              : "!bg-[#d11d45] hover:!bg-[#b9183c]"
          }`}
        >
          {isLoading ? "Placing…" : submitLabel}
        </button>
      )}
      <div className="min-w-0">
        <button
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
          className="rail-icon flex w-full items-center py-2 text-left text-xs font-medium text-[rgb(104,107,130)] hover:opacity-80"
        >
          Order details
          <span className="ms-auto flex shrink-0 items-center text-[var(--text-muted)]">
            <ChevronTiny open={detailsOpen} />
          </span>
        </button>
        {detailsOpen && (
          <div className="flex min-w-0 flex-col gap-2.5 pb-1">
            {isDeriv && (
              <>
                <DetailRow
                  label="Required margin"
                  value={requiredMarginDisplay}
                  labelUnderline
                />
                {isMargin && (
                  <DetailRow label="Margin health" value={marginHealth} />
                )}
                {isFutures && (
                  <DetailRow label="Est. liquidation" value="—" />
                )}
              </>
            )}
            <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
              <button
                type="button"
                className="rail-icon shrink-0 text-[rgb(104,107,130)]"
              >
                Time in force
              </button>
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value as TimeInForce)}
                aria-label="Time in force"
                className="min-w-0 max-w-[11rem] cursor-pointer appearance-none border-0 bg-transparent py-0.5 text-right text-xs font-medium text-[rgb(72,75,94)] outline-none"
              >
                {TIF_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} disabled={!opt.ready}>
                    {opt.label}
                    {!opt.ready ? " (soon)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {isFutures ? (
              <DetailRow
                label="Est. trading fee"
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
                  label="Est. trading fee"
                  value={`${estFeeUsd.toFixed(10).replace(/\.?0+$/, "") || "0"} ${asset}`}
                />
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="rail-icon text-[rgb(104,107,130)] underline decoration-dashed underline-offset-2"
                  >
                    Your maker fee
                  </button>
                  <span className="tabular-nums font-medium text-[rgb(72,75,94)]">
                    {PAPER_MAKER_FEE}
                  </span>
                </div>
              </>
            )}
            {isMargin && <DetailRow label="Est. margin fee" value="—" />}
            {tif === "GTC" && !isFutures && (
              <p className="text-[10px] text-[var(--text-muted)]">
                Paper orders rest until filled or canceled.
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
        Practice money only — you can’t lose anything real.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  radius,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  radius: string;
  prefix?: string;
}) {
  return (
    <label
      className={`relative flex h-10 min-w-0 flex-1 flex-col justify-end overflow-hidden bg-[rgba(104,107,130,0.08)] px-3 hover:bg-[rgba(104,107,130,0.12)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--text-primary)] ${radius}`}
    >
      <span className="pointer-events-none absolute left-3 top-1 text-xs font-normal text-[rgb(104,107,130)]">
        {label}
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

function DetailRow({
  label,
  value,
  labelUnderline = false,
}: {
  label: string;
  value: string;
  labelUnderline?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span
        className={`text-[rgb(104,107,130)] ${
          labelUnderline
            ? "underline decoration-dashed underline-offset-4"
            : ""
        }`}
      >
        {label}
      </span>
      <span className="tabular-nums font-medium text-[rgb(72,75,94)]">
        {value}
      </span>
    </div>
  );
}

function TicketCheck({
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

function ChevronTiny({ open }: { open: boolean }) {
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
