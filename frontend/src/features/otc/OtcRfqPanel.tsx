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
  OTC_OVERALL_EXPOSURE_USD,
  OTC_PORTAL_BENEFITS,
  OTC_PORTAL_FAQ,
  OTC_PORTAL_PAIRS,
  OTC_RFQ_EXPOSURE_USD,
  formatOtcUsd,
  type OtcPortalPair,
} from "./otcPortalContent";

type Side = "BUY" | "SELL";
type Settlement = "automated" | "flexible";

const DEFAULT_PAIR =
  OTC_PORTAL_PAIRS.find((p) => p.id === "BTCUSD") ?? OTC_PORTAL_PAIRS[0];

export default function OtcRfqPanel() {
  const { isSignedIn } = useAuth();
  const toast = useToast();
  const { data: portfolio } = useGetMyPortfolioQuery(undefined, { skip: !isSignedIn });
  const [side, setSide] = useState<Side>("BUY");
  const [pair, setPair] = useState<OtcPortalPair>(DEFAULT_PAIR);
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [settlement] = useState<Settlement>("automated");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [editing, setEditing] = useState<"qty" | "amount" | null>(null);

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
  const availableLabel = formatOtcUsd(Number.isFinite(cash) ? cash : 0, cash >= 1 ? 2 : 4);

  const onQty = (raw: string) => {
    setEditing("qty");
    setQty(raw);
    const q = Number(raw);
    if (!raw || !Number.isFinite(q) || q <= 0) {
      setAmount("");
      return;
    }
    setAmount((q * px).toFixed(2));
  };

  const onAmount = (raw: string) => {
    setEditing("amount");
    setAmount(raw);
    const a = Number(raw);
    if (!raw || !Number.isFinite(a) || a <= 0) {
      setQty("");
      return;
    }
    setQty((a / px).toFixed(8).replace(/\.?0+$/, ""));
  };

  const amountNum = Number(amount);
  const canQuote = Number.isFinite(amountNum) && amountNum >= OTC_MIN_USD;

  const getQuote = () => {
    if (!canQuote) {
      toast({
        title: `Minimum simulated size is ${formatOtcUsd(OTC_MIN_USD)}`,
        tone: "warning",
      });
      return;
    }
    const mid = px * (side === "BUY" ? 1.0005 : 0.9995);
    toast({
      title: `Paper quote · ${side === "BUY" ? "Buy" : "Sell"} ${qty || "—"} ${pair.base} @ ${mid.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${pair.quote}`,
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
    <>
      <div className="grid gap-2 lg:grid-cols-[332px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <section
            className="rounded-2xl bg-[var(--card-bg)] p-4"
            style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
          >
            <h2 className="mb-3 text-base font-medium">Request for quote</h2>
            <div className="mb-3 flex items-center gap-2">
              <div
                className="grid flex-1 grid-cols-2 rounded-xl bg-[rgba(104,107,130,0.08)] p-0.5"
                role="tablist"
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
              <OtcPairPicker
                pair={pair}
                onSelect={(next) => {
                  setPair(next);
                  setQty("");
                  setAmount("");
                }}
              />
            </div>
            <div className="mb-2 flex h-11 items-center justify-between rounded-xl bg-[rgba(104,107,130,0.08)] px-3">
              <input
                value={editing === "amount" && amount === "" ? "" : qty}
                onChange={(e) => onQty(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Quantity"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <span className="shrink-0 text-sm text-[var(--text-muted)]">{pair.base}</span>
            </div>
            <div className="mb-3 flex h-11 items-center justify-between rounded-xl bg-[rgba(104,107,130,0.08)] px-3">
              <input
                value={editing === "qty" && qty === "" ? "" : amount}
                onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Amount"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <span className="shrink-0 text-sm text-[var(--text-muted)]">{pair.quote}</span>
            </div>
            <div className="mb-3 rounded-xl border border-[var(--card-border)] px-3 py-2.5">
              <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="otc-settlement"
                  checked={settlement === "automated"}
                  readOnly
                  className="accent-[var(--accent)]"
                />
                <span className="border-b border-dashed border-[var(--text-muted)]">
                  Automated settlement
                </span>
              </label>
              <label className="flex cursor-not-allowed items-center gap-2 text-sm opacity-50">
                <input
                  type="radio"
                  name="otc-settlement"
                  checked={settlement === "flexible"}
                  disabled
                  className="accent-[var(--accent)]"
                />
                <span className="border-b border-dashed border-[var(--text-muted)]">
                  Flexible settlement
                </span>
              </label>
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
            <h2 className="mb-3 text-base font-medium">Exposure</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Available RFQ exposure</span>
                <span className="font-medium">{formatOtcUsd(OTC_RFQ_EXPOSURE_USD)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Available overall OTC exposure</span>
                <span className="font-medium">{formatOtcUsd(OTC_OVERALL_EXPOSURE_USD)}</span>
              </div>
            </div>
          </section>
        </div>
        <div className="flex flex-col gap-2">
          <section
            className="min-h-[120px] rounded-2xl bg-[var(--card-bg)] p-4"
            style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
          >
            <h2 className="mb-3 text-base font-medium">Recent quotes</h2>
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">No recent quotes.</p>
          </section>
          <section
            className="rounded-2xl bg-[var(--card-bg)] p-4"
            style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
          >
            <h2 className="mb-3 text-base font-medium">Apply for more OTC benefits</h2>
            <div className="flex flex-col gap-2">
              {OTC_PORTAL_BENEFITS.map((b) => {
                const Icon = benefitIcon[b.id as keyof typeof benefitIcon] ?? MessageIcon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toast(`Paper ${b.title} — coming soon`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-black/[0.03]"
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
            className="rounded-2xl bg-[var(--card-bg)] px-4 py-2"
            style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
          >
            <h2 className="px-0 pb-2 pt-2 text-base font-medium">FAQs</h2>
            {OTC_PORTAL_FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center py-3 text-left text-sm hover:bg-black/[0.02]"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`ms-auto flex shrink-0 ps-4 text-[var(--text-muted)] transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDownSmallIcon className="size-5" />
                    </span>
                  </button>
                  {open && (
                    <p className="pb-3 text-sm leading-relaxed text-[var(--text-muted)]">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </>
  );
}
