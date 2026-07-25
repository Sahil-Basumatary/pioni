import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ChevronDownIcon,
  CloseSmallIcon,
  Transfer2Icon,
} from "../../components/shell/shellIcons";
import { useConvert } from "./ConvertContext";
import {
  CONVERT_ASSETS,
  formatConvertAmount,
  quoteReceive,
  type ConvertAsset,
} from "./convertQuote";
import { useLiveMarketTrade } from "../market/liveMarketStore";
import {
  STATUS_BAR_SYMBOLS,
  useMarketSocket,
} from "../market/MarketSocketProvider";
import { useGetMySummaryQuery } from "../portfolio/portfolioApi";
import SignedOutUnlock from "../auth/SignedOutUnlock";
import { baseAsset } from "../../components/shell/activityFormat";
import { useToast } from "../toasts/useToast";

function assetBySymbol(symbol: string): ConvertAsset {
  return CONVERT_ASSETS.find((a) => a.symbol === symbol) ?? CONVERT_ASSETS[0];
}

function AssetBadge({ asset }: { asset: ConvertAsset }) {
  if (asset.icon) {
    return (
      <img
        src={asset.icon}
        alt=""
        className="h-5 w-5 rounded-full"
        width={20}
        height={20}
      />
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#268c45] text-[9px] font-semibold text-white">
      $
    </span>
  );
}

// Only the status-bar symbols stream by default, so the dialog subscribes to the remainder for
// as long as it is open — otherwise SOL and XRP would never receive a price.
const ALWAYS_STREAMED = new Set<string>(STATUS_BAR_SYMBOLS);
const CONVERT_EXTRA_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"].filter(
  (symbol) => !ALWAYS_STREAMED.has(symbol),
);

function useConvertStream(open: boolean) {
  const { subscribe, unsubscribe } = useMarketSocket();
  useEffect(() => {
    if (!open) return;
    subscribe(CONVERT_EXTRA_SYMBOLS);
    return () => unsubscribe(CONVERT_EXTRA_SYMBOLS);
  }, [open, subscribe, unsubscribe]);
}

/**
 * Live USD price per convertible asset. The hook count is fixed because CONVERT_ASSETS is a
 * module constant, so calling one hook per asset here stays rules-of-hooks safe.
 */
function useConvertPrices(): Record<string, number | null> {
  const btc = useLiveMarketTrade("BTCUSDT");
  const eth = useLiveMarketTrade("ETHUSDT");
  const sol = useLiveMarketTrade("SOLUSDT");
  const xrp = useLiveMarketTrade("XRPUSDT");
  return useMemo(() => {
    const price = (trade: { price: string } | null) => {
      const n = trade ? Number(trade.price) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    return {
      USD: 1,
      BTC: price(btc),
      ETH: price(eth),
      SOL: price(sol),
      XRP: price(xrp),
    };
  }, [btc, eth, sol, xrp]);
}

export default function ConvertDialog() {
  const { open, fromSymbol, toSymbol, closeConvert, setPair } = useConvert();
  const { isSignedIn } = useAuth();
  const [fromRaw, setFromRaw] = useState("");
  const [pct, setPct] = useState(100);
  const [menu, setMenu] = useState<"from" | "to" | null>(null);
  const toast = useToast();
  useConvertStream(open);
  const prices = useConvertPrices();
  const { data: summary } = useGetMySummaryQuery(undefined, {
    skip: !isSignedIn || !open,
  });

  const balances = useMemo(() => {
    const map: Record<string, number> = {
      USD: Number(summary?.portfolio.cash_balance ?? 0),
    };
    for (const position of summary?.positions ?? []) {
      const qty = Number(position.quantity);
      if (!Number.isFinite(qty) || qty === 0) continue;
      map[baseAsset(position.symbol)] = qty;
    }
    return map;
  }, [summary]);

  useEffect(() => {
    if (!open) return;
    setFromRaw("");
    setPct(100);
    setMenu(null);
  }, [open, fromSymbol, toSymbol]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const available = balances[fromSymbol] ?? 0;
  const fromAmount = Number.parseFloat(fromRaw.replace(/,/g, "")) || 0;
  const toAmount = quoteReceive(fromAmount, prices[fromSymbol], prices[toSymbol]);
  const priced = prices[fromSymbol] != null && prices[toSymbol] != null;
  const canReview =
    priced && fromAmount > 0 && fromAmount <= available + 1e-12;

  const hint = useMemo(() => {
    if (!priced) {
      return `Waiting for a live ${prices[fromSymbol] == null ? fromSymbol : toSymbol} price`;
    }
    if (available <= 0) {
      return `You don't have any ${fromSymbol} to convert`;
    }
    if (fromAmount > available) {
      return `Amount exceeds available ${fromSymbol}`;
    }
    return `Available ${available.toLocaleString("en-US")} ${fromSymbol}`;
  }, [available, fromAmount, fromSymbol, priced, prices, toSymbol]);

  if (!open) return null;

  const flash = (msg: string) => toast(msg);

  const applyPct = (nextPct: number) => {
    setPct(nextPct);
    if (available <= 0) {
      setFromRaw("");
      return;
    }
    const qty = (available * nextPct) / 100;
    setFromRaw(formatConvertAmount(qty, fromSymbol));
  };

  const onFromChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setFromRaw(cleaned);
    const n = Number.parseFloat(cleaned);
    if (!Number.isFinite(n) || available <= 0) {
      setPct(0);
      return;
    }
    setPct(Math.max(0, Math.min(100, Math.round((n / available) * 100))));
  };

  const swap = () => {
    setPair(toSymbol, fromSymbol);
    setFromRaw("");
    setPct(100);
  };

  const pick = (side: "from" | "to", symbol: string) => {
    if (side === "from") {
      setPair(symbol, symbol === toSymbol ? fromSymbol : toSymbol);
      setFromRaw("");
      setPct(100);
    } else {
      setPair(symbol === fromSymbol ? toSymbol : fromSymbol, symbol);
    }
    setMenu(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[min(12vh,150px)]">
      <button
        type="button"
        aria-label="Dismiss convert"
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
        onClick={closeConvert}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Convert"
        className="relative z-[1] w-full max-w-[400px] rounded-[20px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h1 className="text-base font-medium leading-6">Convert</h1>
          <button
            type="button"
            aria-label="Close"
            onClick={closeConvert}
            className="rail-icon inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[rgba(104,107,130,0.08)]"
          >
            <CloseSmallIcon className="h-4 w-4" />
          </button>
        </div>

        {!isSignedIn ? (
          <div className="px-5 pb-5">
            <SignedOutUnlock size="panel" />
          </div>
        ) : (
        <div className="flex flex-col gap-2 px-5 pb-5">
          <AssetRow
            label="From"
            labelClassName="text-base"
            amount={fromRaw}
            onAmountChange={onFromChange}
            asset={assetBySymbol(fromSymbol)}
            menuOpen={menu === "from"}
            onToggleMenu={() => setMenu((m) => (m === "from" ? null : "from"))}
            onPick={(s) => pick("from", s)}
            amountLabel="From amount"
          />

          <div className="relative z-[1] -my-1 flex justify-center">
            <button
              type="button"
              aria-label="Swap assets"
              onClick={swap}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(104,107,130,0.08)] text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.14)]"
            >
              <Transfer2Icon className="h-4 w-4" />
            </button>
          </div>

          <AssetRow
            label="To"
            labelClassName="text-xs"
            prefix="≈"
            amount={formatConvertAmount(toAmount, toSymbol)}
            readOnly
            asset={assetBySymbol(toSymbol)}
            menuOpen={menu === "to"}
            onToggleMenu={() => setMenu((m) => (m === "to" ? null : "to"))}
            onPick={(s) => pick("to", s)}
            amountLabel="To amount"
          />

          <div className="mt-1 flex items-center gap-3 px-0.5">
            <div className="relative flex h-2 min-w-0 flex-1 items-center">
              <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-[rgba(104,107,130,0.12)]">
                <div
                  className="h-full rounded-full bg-[rgba(104,107,130,0.4)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={pct}
                onChange={(e) => applyPct(Number(e.target.value))}
                className="convert-size-slider relative z-[1] w-full"
                aria-label="Convert percent of balance"
              />
            </div>
            <p className="shrink-0 text-base font-medium tabular-nums">{pct}%</p>
          </div>

          <p
            className={`mt-1 text-base ${
              available <= 0 || fromAmount > available
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {hint}
          </p>

          <button
            type="button"
            disabled={!canReview}
            onClick={() =>
              flash(
                `Preview only — converting ${fromRaw || "0"} ${fromSymbol} would return about ${formatConvertAmount(toAmount, toSymbol)} ${toSymbol}. No balances moved.`,
              )
            }
            className={`mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-black text-sm font-medium text-white ${
              canReview
                ? "hover:bg-[rgb(32,32,32)]"
                : "cursor-not-allowed opacity-40 pointer-events-none"
            }`}
          >
            Review
          </button>
        </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function AssetRow({
  label,
  labelClassName,
  amount,
  onAmountChange,
  readOnly,
  prefix,
  asset,
  menuOpen,
  onToggleMenu,
  onPick,
  amountLabel,
}: {
  label: string;
  labelClassName: string;
  amount: string;
  onAmountChange?: (v: string) => void;
  readOnly?: boolean;
  prefix?: string;
  asset: ConvertAsset;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPick: (symbol: string) => void;
  amountLabel: string;
}) {
  return (
    <div className="relative rounded-2xl bg-[rgba(104,107,130,0.08)] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[var(--text-muted)] ${labelClassName}`}>{label}</p>
        <button
          type="button"
          onClick={onToggleMenu}
          className="rail-icon inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <AssetBadge asset={asset} />
          {asset.symbol}
          <ChevronDownIcon className="h-3 w-3 text-[var(--text-muted)]" />
        </button>
      </div>
      <div className="mt-0.5 flex h-12 items-center gap-1">
        {prefix && (
          <span className="text-sm text-[var(--text-muted)]">{prefix}</span>
        )}
        {readOnly ? (
          <p
            aria-label={amountLabel}
            className="w-full text-sm tabular-nums text-[var(--text-primary)]"
          >
            {amount}
          </p>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange?.(e.target.value)}
            aria-label={amountLabel}
            className="h-12 w-full bg-transparent text-sm tabular-nums outline-none placeholder:text-[var(--text-muted)]"
          />
        )}
      </div>
      {menuOpen && (
        <div className="absolute right-2 top-10 z-20 min-w-[9rem] overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {CONVERT_ASSETS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.symbol)}
              className="rail-icon flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[rgba(104,107,130,0.08)]"
            >
              <AssetBadge asset={a} />
              {a.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
