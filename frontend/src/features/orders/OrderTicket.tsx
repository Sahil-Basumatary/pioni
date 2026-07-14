import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectSymbol } from "../instrument/instrumentSlice";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import {
  useGetMyPortfolioQuery,
  useGetMyPositionsQuery,
} from "../portfolio/portfolioApi";
import { useSubmitOrderMutation, type OrderSide, type OrderType } from "./ordersApi";
import { evaluateOrder } from "./orderValidation";
import { formatUsd } from "../../utils/formatters";

function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$|USD$|USDC$/i, "") || symbol;
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

export default function OrderTicket() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const symbol = useAppSelector(selectSymbol);
  const trade = useLiveMarketTrade(symbol);
  const livePrice = trade ? Number(trade.price) : null;
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
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [tif, setTif] = useState<TimeInForce>("GTC");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedNote, setAdvancedNote] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();
  const advancedRef = useRef<HTMLDivElement>(null);
  const advancedMenuId = useId();
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
  const canAct = isSignedIn ? evaluation.canSubmit : quantity.trim().length > 0;
  const effectivePrice =
    orderType === "LIMIT" ? Number(limitPrice) || null : livePrice;
  const needsFunds =
    isSignedIn &&
    isBuy &&
    cashBalance != null &&
    cashBalance <= 0;
  const estFeeUsd = 0;

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
        ...(orderType === "LIMIT" ? { price: limitPrice } : {}),
      }).unwrap();
      const filled = order.status === "FILLED";
      setFeedback({
        tone: "success",
        message: filled
          ? `Filled — ${isBuy ? "bought" : "sold"} ${order.filled_quantity} ${asset}`
          : `Order placed (${order.status.toLowerCase().replace(/_/g, " ")})`,
      });
      setQuantity("");
      setTotal("");
      setSizePct(0);
      setTpSl(false);
      setPostOnly(false);
    } catch (err) {
      setFeedback({ tone: "error", message: extractError(err) });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-[var(--card-bg)] p-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg)] p-1">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={`rail-icon rounded-lg py-2 text-sm font-semibold transition-colors ${
            isBuy ? "!bg-emerald-500 text-white" : "bg-transparent text-[var(--text-muted)]"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={`rail-icon rounded-lg py-2 text-sm font-semibold transition-colors ${
            !isBuy ? "!bg-red-500 text-white" : "bg-transparent text-[var(--text-muted)]"
          }`}
        >
          Sell
        </button>
      </div>
      <div className="relative flex flex-wrap items-center gap-1 text-xs" ref={advancedRef}>
        {(["LIMIT", "MARKET"] as const).map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => {
              setOrderType(type);
              setAdvancedNote(null);
            }}
            className={`rail-icon rounded-lg px-3 py-1.5 font-medium transition-colors ${
              orderType === type && !advancedNote
                ? "!bg-black/[0.08] text-[var(--text-primary)]"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {type === "MARKET" ? "Market" : "Limit"}
          </button>
        ))}
        <button
          type="button"
          aria-label="Advanced"
          aria-haspopup="menu"
          aria-expanded={advancedOpen}
          aria-controls={advancedMenuId}
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`rail-icon inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
            advancedOpen || advancedNote
              ? "!bg-black/[0.08] text-[var(--text-primary)]"
              : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
      {orderType === "LIMIT" && (
        <Field
          label={`Limit price USD`}
          value={limitPrice}
          onChange={(v) => {
            setLimitPrice(v);
            const price = Number(v);
            const q = Number(quantity);
            if (Number.isFinite(price) && price > 0 && Number.isFinite(q) && q > 0) {
              setTotal(formatTotalInput(q * price));
            }
          }}
          placeholder="0.00"
        />
      )}
      <Field
        label={`Quantity ${asset}`}
        value={quantity}
        onChange={(v) => syncFromQuantity(v, effectivePrice)}
        placeholder="0.00"
      />
      <Field
        label="Total USD"
        value={total}
        onChange={(v) => syncFromTotal(v, effectivePrice)}
        placeholder="0.00"
      />
      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sizePct}
          onChange={(e) => applySizePct(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label="Order size percent"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          {[0, 25, 50, 75, 100].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applySizePct(p)}
              className={`rail-icon rounded px-1 ${
                sizePct === p ? "text-[var(--text-primary)]" : ""
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Available balance</span>
        <span className="flex items-center gap-1 tabular-nums text-[var(--text-primary)]">
          {isSignedIn
            ? isBuy
              ? cashBalance != null
                ? formatUsd(cashBalance)
                : "—"
              : `${baseQty || 0} ${asset}`
            : "—"}
          <Link
            to="/deposit"
            className="rail-icon inline-flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
            aria-label="Add funds"
            title="Add funds"
          >
            +
          </Link>
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={tpSl}
            onChange={(e) => setTpSl(e.target.checked)}
            className="accent-[var(--accent)]"
            aria-label="TP/SL"
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
          <input
            type="checkbox"
            checked={postOnly}
            disabled={orderType !== "LIMIT"}
            onChange={(e) => setPostOnly(e.target.checked)}
            className="accent-[var(--accent)]"
            aria-label="Post only"
          />
          Post only
        </label>
      </div>
      {tpSl && (
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
          className="mt-auto block rounded-xl bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Add USD to trade
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canAct || isLoading}
          className={`mt-auto rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBuy ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isLoading
            ? "Placing…"
            : !isSignedIn
              ? `${isBuy ? "Buy" : "Sell"} ${asset}`
              : evaluation.reason ?? `${isBuy ? "Buy" : "Sell"} ${asset}`}
        </button>
      )}
      <div className="rounded-xl border border-[var(--card-border)]">
        <button
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
          className="rail-icon flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
        >
          Order details
          <ChevronTiny open={detailsOpen} />
        </button>
        {detailsOpen && (
          <div className="flex flex-col gap-2 border-t border-[var(--card-border)] px-3 py-2">
            <label className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>Time in force</span>
              <select
                value={tif}
                onChange={(e) => setTif(e.target.value as TimeInForce)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                aria-label="Time in force"
              >
                {TIF_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} disabled={!opt.ready}>
                    {opt.label}
                    {!opt.ready ? " (soon)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Est. trading fee</span>
              <span className="tabular-nums text-[var(--text-primary)]">
                {estFeeUsd.toFixed(4)} USD
              </span>
            </div>
            {tif === "GTC" && (
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm font-medium tabular-nums text-[var(--text-primary)] outline-none"
      />
    </label>
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
