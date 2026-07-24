import { useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  BorrowIcon,
  ChevronDownSmallIcon,
  ChevronRightIcon,
  MessageIcon,
  PlusCircleIcon,
} from "../../components/shell/shellIcons";
import { useGetMyPortfolioQuery } from "../portfolio/portfolioApi";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import OtcPairPicker from "./OtcPairPicker";
import { useToast } from "../toasts/useToast";
import {
  OTC_MIN_USD,
  OTC_PORTAL_BENEFITS,
  OTC_PORTAL_PAIRS,
  formatOtcUsd,
  type OtcPortalPair,
} from "./otcPortalContent";

type Side = "BUY" | "SELL";
type QtyUnit = "base" | "quote";

const DEFAULT_PAIR =
  OTC_PORTAL_PAIRS.find((p) => p.id === "BTCUSD") ?? OTC_PORTAL_PAIRS[0];

export default function OtcRfqPanel() {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const { data: portfolio } = useGetMyPortfolioQuery(undefined, {
    skip: !isSignedIn,
  });
  const [side, setSide] = useState<Side>("BUY");
  const [pair, setPair] = useState<OtcPortalPair>(DEFAULT_PAIR);
  const [raw, setRaw] = useState("");
  const [unit, setUnit] = useState<QtyUnit>("base");

  const live = useLiveMarketTrade(pair.symbol);
  const price = Number(live?.price);
  const px =
    Number.isFinite(price) && price > 0
      ? price
      : pair.base === "BTC"
        ? 64000
        : pair.base === "ETH"
          ? 1860
          : pair.base === "USDC" || pair.base === "USDT"
            ? 1
            : 140;

  const cash = Number(portfolio?.cash_balance ?? 0);
  const availableLabel = formatOtcUsd(
    Number.isFinite(cash) ? cash : 0,
    cash >= 1 ? 2 : 4,
  );

  const { qtyBase, amountUsd } = useMemo(() => {
    const n = Number(raw);
    if (!raw || !Number.isFinite(n) || n <= 0) {
      return { qtyBase: 0, amountUsd: 0 };
    }
    if (unit === "base") {
      return { qtyBase: n, amountUsd: n * px };
    }
    return { qtyBase: n / px, amountUsd: n };
  }, [raw, unit, px]);

  const canQuote = amountUsd >= OTC_MIN_USD;

  const getQuote = () => {
    if (!canQuote) {
      toast({
        title: `Minimum simulated size is ${formatOtcUsd(OTC_MIN_USD)}`,
        tone: "warning",
      });
      return;
    }
    const mid = px * (side === "BUY" ? 1.0005 : 0.9995);
    const qtyLabel = qtyBase.toLocaleString("en-US", { maximumFractionDigits: 8 });
    toast({
      title: `Paper quote · ${side === "BUY" ? "Buy" : "Sell"} ${qtyLabel} ${pair.base} @ ${mid.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${pair.quote}`,
      body: "0.00% fee · simulated only",
      tone: "positive",
    });
  };

  const benefitIcon = useMemo(
    () => ({
      chat: MessageIcon,
      lending: BorrowIcon,
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 px-0.5 pb-1">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          OTC Spot RFQ
        </h1>
        <p className="text-sm text-[rgb(104,107,130)]">
          Block trade execution off the order book
        </p>
      </div>

      <section
        className="rounded-2xl bg-[var(--card-bg)] p-4"
        style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
      >
        <h2 className="mb-3 text-base font-medium">Request for quote</h2>

        <div className="mb-3">
          <OtcPairPicker
            pair={pair}
            fullWidth
            onSelect={(next) => {
              setPair(next);
              setRaw("");
              setUnit("base");
            }}
          />
        </div>

        <div
          className="mb-3 grid grid-cols-2 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
          role="tablist"
          aria-label="Side"
        >
          <button
            type="button"
            role="tab"
            aria-selected={side === "BUY"}
            onClick={() => setSide("BUY")}
            className={`rounded-[10px] px-2 py-1.5 text-xs font-medium ${
              side === "BUY"
                ? "bg-[rgba(20,158,97,0.24)] text-[#08844f]"
                : "bg-transparent text-[rgb(104,107,130)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={side === "SELL"}
            onClick={() => setSide("SELL")}
            className={`rounded-[10px] px-2 py-1.5 text-xs font-medium ${
              side === "SELL"
                ? "bg-[rgba(245,57,94,0.24)] text-[#d11d45]"
                : "bg-transparent text-[rgb(104,107,130)]"
            }`}
          >
            Sell
          </button>
        </div>

        <div className="mb-3 flex h-11 items-center gap-2 rounded-xl bg-[rgba(104,107,130,0.08)] px-3">
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Quantity"
            inputMode="decimal"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <div
            role="tablist"
            aria-label="Quantity unit"
            className="grid shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-[rgba(104,107,130,0.12)] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={unit === "base"}
              onClick={() => {
                if (unit === "quote" && raw && amountUsd > 0) {
                  setRaw(
                    qtyBase
                      .toFixed(8)
                      .replace(/\.?0+$/, ""),
                  );
                }
                setUnit("base");
              }}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                unit === "base"
                  ? "bg-[rgba(104,107,130,0.12)] text-[var(--text-primary)]"
                  : "text-[rgb(104,107,130)]"
              }`}
            >
              {pair.base}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={unit === "quote"}
              onClick={() => {
                if (unit === "base" && raw && amountUsd > 0) {
                  setRaw(amountUsd.toFixed(2));
                }
                setUnit("quote");
              }}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                unit === "quote"
                  ? "bg-[rgba(104,107,130,0.12)] text-[var(--text-primary)]"
                  : "text-[rgb(104,107,130)]"
              }`}
            >
              {pair.quote}
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs text-[rgb(104,107,130)] underline decoration-dashed underline-offset-4">
            Settlement
          </span>
          <button
            type="button"
            onClick={() => toast("Paper settlement — automated only for now")}
            className="rail-icon inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]"
          >
            Automated
            <ChevronDownSmallIcon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Available balance</span>
          <span className="inline-flex items-center gap-1 font-medium">
            <button
              type="button"
              aria-label="Add funds"
              onClick={() => toast("Paper deposit — use TopBar Deposit")}
              className="inline-flex"
            >
              <PlusCircleIcon className="size-4 text-[var(--text-muted)]" />
            </button>
            {availableLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={getQuote}
          disabled={!canQuote}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-medium text-white enabled:hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Get quote
        </button>
      </section>

      <section
        className="rounded-2xl bg-[var(--card-bg)] p-4"
        style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
      >
        <h2 className="mb-3 text-base font-medium">More OTC spot features</h2>
        <div className="flex flex-col gap-1">
          {OTC_PORTAL_BENEFITS.map((b) => {
            const Icon = benefitIcon[b.id as keyof typeof benefitIcon] ?? MessageIcon;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toast(`Paper ${b.title} — coming soon`)}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-black/[0.03]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(42,42,42,0.08)]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{b.title}</span>
                  <span className="block text-xs leading-relaxed text-[var(--text-muted)]">
                    {b.body}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="min-h-[120px] rounded-2xl bg-[var(--card-bg)] p-4"
        style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
      >
        <h2 className="mb-3 text-base font-medium">Recent quotes</h2>
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">
          No recent quotes.
        </p>
      </section>
    </div>
  );
}
