import { useState } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useAppSelector } from "../../app/hooks";
import { selectSymbol } from "../instrument/instrumentSlice";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import { useGetMyPortfolioQuery } from "../portfolio/portfolioApi";
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      {children}
    </div>
  );
}

type Feedback = { tone: "success" | "error"; message: string };

export default function OrderTicket() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const symbol = useAppSelector(selectSymbol);
  const trade = useLiveMarketTrade(symbol);
  const livePrice = trade ? Number(trade.price) : null;
  const { data: portfolio } = useGetMyPortfolioQuery(undefined, {
    skip: !isSignedIn,
  });
  const cashBalance = portfolio ? Number(portfolio.cash_balance) : null;
  const [side, setSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();
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

  async function handleSubmit() {
    setFeedback(null);
    if (!isSignedIn) {
      openSignIn({});
      return;
    }
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
    } catch (err) {
      setFeedback({ tone: "error", message: extractError(err) });
    }
  }

  return (
    <Shell>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg)] p-1">
        <button
          onClick={() => setSide("BUY")}
          className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
            isBuy ? "bg-emerald-500 text-white" : "bg-transparent text-[var(--text-muted)]"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("SELL")}
          className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
            !isBuy ? "bg-red-500 text-white" : "bg-transparent text-[var(--text-muted)]"
          }`}
        >
          Sell
        </button>
      </div>
      <div className="flex gap-2 text-xs">
        {(["MARKET", "LIMIT"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              orderType === type
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg)] text-[var(--text-muted)]"
            }`}
          >
            {type === "MARKET" ? "Market" : "Limit"}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
        Amount ({asset})
        <input
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </label>
      {orderType === "LIMIT" && (
        <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
          Limit price (USD)
          <input
            inputMode="decimal"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0.00"
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </label>
      )}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{orderType === "MARKET" ? "Est. price" : "Your price"}</span>
        <span className="text-[var(--text-primary)]">
          {evaluation.effectivePrice != null ? formatUsd(evaluation.effectivePrice) : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Est. total</span>
        <span className="text-[var(--text-primary)]">
          {evaluation.estimatedTotal != null ? formatUsd(evaluation.estimatedTotal) : "—"}
        </span>
      </div>
      {isSignedIn && cashBalance != null && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Buying power</span>
          <span>{formatUsd(cashBalance)}</span>
        </div>
      )}
      <button
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
    </Shell>
  );
}
