import { useMemo, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { ChevronDownSmallIcon } from "../components/shell/shellIcons";
import {
  PropBalanceIcon,
  PropBillIcon,
  PropExpandIcon,
  PropFileTextIcon,
  PropShieldTickIcon,
  PropWithdrawIcon,
} from "../features/prop/propBenefitIcons";

const WALLET_SIZES = [5_000, 10_000, 25_000, 50_000, 100_000, 200_000] as const;

type PlanId = "starter" | "intermediate" | "advanced";

type Plan = {
  id: PlanId;
  label: string;
  targetProfit: string;
  maxDailyLoss: string;
  maxDrawdown: string;
  evaluationFee: string;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    label: "Starter",
    targetProfit: "10%",
    maxDailyLoss: "3%",
    maxDrawdown: "6%",
    evaluationFee: "85.00 USD",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    targetProfit: "12%",
    maxDailyLoss: "3%",
    maxDrawdown: "5%",
    evaluationFee: "65.00 USD",
  },
  {
    id: "advanced",
    label: "Advanced",
    targetProfit: "9%",
    maxDailyLoss: "3%",
    maxDrawdown: "3%",
    evaluationFee: "40.00 USD",
  },
];

type BenefitIcon = ComponentType<SVGProps<SVGSVGElement>>;

const BENEFITS: { title: string; body: string; Icon: BenefitIcon }[] = [
  {
    title: "No capital needed",
    body: "Pass the evaluation and unlock up to $200,000 in buying power without risking your own funds.",
    Icon: PropBillIcon,
  },
  {
    title: "Trader-friendly rules",
    body: "No time limits for the evaluation, consistency rules, profit caps or restrictions on your trading strategy.",
    Icon: PropFileTextIcon,
  },
  {
    title: "Limited risk",
    body: "Because you don’t need to deposit trading capital, you only pay for the evaluation. We cover any losses.",
    Icon: PropBalanceIcon,
  },
  {
    title: "Payouts on demand",
    body: "Withdraw profits anytime and get paid within 24 hours, directly to your Pioni account.",
    Icon: PropWithdrawIcon,
  },
  {
    title: "Institutional trading environment",
    body: "Trade 60+ crypto pairs with deep liquidity and advanced tools, directly within Pioni.",
    Icon: PropExpandIcon,
  },
  {
    title: "Proven and trusted",
    body: "Over 35,000 wallets funded since 2023, with zero payout delays in all market conditions.",
    Icon: PropShieldTickIcon,
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is prop trading?",
    a: "Prop trading (proprietary trading) is when traders trade with a company’s capital instead of their own. Traders are allocated company funds, trade within set risk limits and share in the profits. The company provides the capital and absorbs trading losses. Pioni Prop lets you trade with up to $200,000 of Pioni capital and keep up to 90% of your profits. Start by taking an evaluation in a simulated trading environment that reflects live market conditions. If you reach the profit target without breaching the risk limits, you’ll pass the evaluation and get a funded wallet to trade with.",
  },
  {
    q: "How does Pioni Prop differ from trading on Pioni?",
    a: "Pioni Prop uses the same interface and trading tools as Pioni. The difference is that you trade with Pioni capital instead of your own funds.",
  },
  {
    q: "Why do I need to pay a fee to trade?",
    a: "The fee covers the evaluation. It’s a one-time cost (per evaluation) to demonstrate consistent, risk-managed trading. You don’t need to deposit trading capital — the evaluation fee is your only financial risk. Pioni covers any trading losses beyond that.",
  },
  {
    q: "Is the evaluation time-limited?",
    a: "No. Once you purchase an evaluation, your goal is to reach the profit target without breaching the risk limits. There’s no time limit, so you can trade at your own pace.",
  },
  {
    q: "What are the risk limits?",
    a: "Risk limits vary according to the plan you choose. They define the maximum loss allowed in a day or over the lifetime of an evaluation or funded wallet.",
  },
  {
    q: "What if I don’t pass the evaluation?",
    a: "If your equity falls to or below the daily loss limit or the maximum drawdown limit, the evaluation wallet will be closed. You don’t owe any additional funds and you can buy a new evaluation at any time. The evaluation fee is non-refundable.",
  },
  {
    q: "Are there any conflicts of interest I should know about?",
    a: "When a funded trader’s balance hits the max-loss line, the firm is released from any liability to pay future performance fees — so the firm’s financial interest is opposite to yours. The firm may receive financial incentives from third parties based on trade ideas provided by funded traders. Any such revenue is retained solely by the firm and is not shared with funded traders. Because such financial incentives are not included in PnL for funded traders, conflicts of interest may exist between the firm and each funded trader. Funded traders should carefully consider these conflicts before participating. In addition, because fees are earned each time an evaluation trader fails and then re-purchases an evaluation, conflicts of interest may also exist between the platform and each evaluation trader.",
  },
];

function formatWallet(n: number): string {
  return `${n.toLocaleString("en-US")} USD`;
}

export default function PropPage() {
  const [walletSize, setWalletSize] = useState<(typeof WALLET_SIZES)[number]>(10_000);
  const [planId, setPlanId] = useState<PlanId>("starter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [notified, setNotified] = useState(false);
  const plan = useMemo(
    () => PLANS.find((p) => p.id === planId) ?? PLANS[0],
    [planId],
  );

  return (
    <div className="mx-auto w-full max-w-[900px] pb-20 pt-1 text-[rgb(16,17,20)]">
      <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl bg-[rgba(0,146,216,0.04)] p-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(0,121,180)] text-[11px] font-semibold text-white"
          >
            i
          </span>
          <div className="min-w-0 text-sm leading-[1.4]">
            <p className="font-medium">
              Pioni Prop isn&apos;t available in United Kingdom yet
            </p>
            <p className="text-[rgb(72,75,94)]">
              We&apos;ll notify you once Prop is available
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNotified(true)}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[rgb(0,121,180)] px-2 text-xs font-medium text-white hover:bg-[rgb(0,105,158)]"
        >
          {notified ? "Subscribed" : "Get notified"}
        </button>
      </div>

      <header className="mb-14 flex flex-col items-center text-center">
        <h1 className="text-[48px] font-normal leading-[56px] tracking-tight">
          Trade with our money — not yours
        </h1>
        <p className="mt-5 whitespace-pre-wrap text-[20px] font-normal leading-7 text-[rgb(16,17,20)]">
          {"You bring the strategy. We provide the capital.\nYou keep up to 90% of your profits."}
        </p>
        <div className="mt-6 flex w-full items-center justify-center">
          <PropHeroArt />
        </div>
      </header>

      <section className="mb-16 flex flex-col items-center gap-6">
        <h2 className="text-center text-[28px] font-normal leading-9">
          How it works
        </h2>
        <div className="grid w-full gap-4 md:grid-cols-3">
          <HowCard
            title="Buy an evaluation"
            body="Reach a profit target while staying within loss limits in a simulated trading environment."
          >
            <PropStepGlass>
              <p className="text-xs leading-4 text-[var(--text-muted)]">
                Plan and wallet size
              </p>
              <p className="mt-1 text-sm font-medium leading-5 text-[var(--text-primary)]">
                {plan.label} {formatWallet(walletSize)}
              </p>
              <button
                type="button"
                className="rail-icon mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]"
              >
                Plan details
                <ChevronDownSmallIcon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-auto inline-flex h-9 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--accent)] px-3 text-sm font-medium text-white opacity-40 pointer-events-none"
              >
                Proceed to payment
              </button>
            </PropStepGlass>
          </HowCard>
          <HowCard
            title="Get funded"
            body="Pass the evaluation to get a funded wallet with up to $200,000 of Pioni’s capital."
          >
            <PropStepGlass className="items-center justify-center gap-3 px-4 py-5 text-center">
              <PropFundedMark />
              <div className="text-sm font-medium leading-5 text-[var(--text-primary)]">
                <p>Congratulations!</p>
                <p>You passed the evaluation.</p>
              </div>
            </PropStepGlass>
          </HowCard>
          <HowCard
            title="Collect profits"
            body="Once funded, keep up to 90% of gains and withdraw to your Pioni account at any time."
          >
            <PropStepGlass>
              <p className="text-xs leading-4 text-[var(--text-muted)]">
                Available for{" "}
                <span className="underline decoration-dotted underline-offset-2">
                  payout
                </span>
              </p>
              <p className="mt-1 text-base font-medium leading-6 tabular-nums text-[var(--text-primary)]">
                276.45 USD
              </p>
              <div className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] leading-3 text-[var(--text-muted)]">
                    Amount
                  </p>
                  <p className="text-sm font-medium leading-5 tabular-nums text-[var(--text-primary)]">
                    200.00
                  </p>
                </div>
                <button
                  type="button"
                  className="rail-icon inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--text-muted)]"
                >
                  USD
                  <ChevronDownSmallIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3">
                <div className="relative h-2 w-full rounded-full bg-black/[0.08]">
                  <div className="absolute inset-y-0 left-0 w-[72%] rounded-full bg-[#1ecb8c]" />
                  <div className="absolute top-1/2 left-[72%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.18)]" />
                </div>
                <p className="mt-1 text-right text-[10px] tabular-nums text-[var(--text-muted)]">
                  72%
                </p>
              </div>
            </PropStepGlass>
          </HowCard>
        </div>
      </section>

      <section className="mb-16 grid grid-cols-1 gap-7 sm:grid-cols-2">
        {BENEFITS.map(({ title, body, Icon }) => (
          <div key={title} className="flex flex-col">
            <Icon className="h-6 w-6 text-[var(--text-primary)]" />
            <h3 className="mt-2.5 text-sm font-medium leading-5 text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">{body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 flex flex-col items-center gap-5">
        <h2 className="text-center text-[28px] font-normal leading-9">
          Choose your wallet size
        </h2>
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1">
          {WALLET_SIZES.map((size) => {
            const active = size === walletSize;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setWalletSize(size)}
                className={`rail-icon rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "!bg-white text-[rgb(16,17,20)]"
                    : "!bg-transparent text-[rgb(104,107,130)]"
                }`}
              >
                {formatWallet(size)}
              </button>
            );
          })}
        </div>

        <div className="w-full overflow-x-auto rounded-2xl border border-[var(--card-border)]">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-left text-[rgb(104,107,130)]">
                <th className="px-4 py-3 font-medium">Plans</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={`rail-icon ${
                        planId === p.id
                          ? "font-semibold text-[rgb(16,17,20)]"
                          : "text-[rgb(104,107,130)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <PlanTableRow
                label="Target profit"
                values={PLANS.map((p) => p.targetProfit)}
                active={planId}
              />
              <PlanTableRow
                label="Max daily loss"
                values={PLANS.map((p) => p.maxDailyLoss)}
                active={planId}
              />
              <PlanTableRow
                label="Max drawdown"
                values={PLANS.map((p) => p.maxDrawdown)}
                active={planId}
              />
              <PlanTableRow
                label="Evaluation fee"
                values={PLANS.map((p) => p.evaluationFee)}
                active={planId}
                last
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-[28px] font-normal leading-9">
          Pioni Prop FAQ
        </h2>
        <div className="divide-y divide-[var(--card-border)] border-y border-[var(--card-border)]">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="rail-icon flex min-h-12 w-full items-center gap-3 py-3 text-left text-base font-medium leading-6"
                >
                  <span className="flex-1">{item.q}</span>
                  <ChevronDownSmallIcon
                    className={`h-4 w-4 shrink-0 text-[rgb(104,107,130)] transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <p className="pb-4 text-sm leading-5 text-[rgb(104,107,130)]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PropFundedMark() {
  return (
    <svg
      aria-hidden="true"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="h-16 w-16 shrink-0"
    >
      <defs>
        <linearGradient id="propFundedRing" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c8cad4" />
          <stop offset="0.45" stopColor="#7a7e92" />
          <stop offset="1" stopColor="#3a3d4d" />
        </linearGradient>
        <linearGradient id="propFundedFace" x1="16" y1="14" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4f5f8" />
          <stop offset="0.55" stopColor="#dfe1ea" />
          <stop offset="1" stopColor="#aeb1c0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#propFundedRing)" />
      <circle cx="32" cy="32" r="22" fill="url(#propFundedFace)" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="rgba(0,121,180,0.28)"
        strokeWidth="1.5"
      />
      <path
        d="M22.5 32.5l6.2 6.2 13.3-14"
        fill="none"
        stroke="#101114"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PropHeroArt() {
  return (
    <img
      src="/illustrations/prop-hero-coins.png"
      alt=""
      width={520}
      height={520}
      className="h-auto w-full max-w-[min(330px,92vw)] object-contain select-none"
      draggable={false}
    />
  );
}

function PropStepGlass({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`prop-step-glass mt-4 flex min-h-[152px] flex-1 flex-col ${className}`}
    >
      {children}
    </div>
  );
}

function HowCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--card-border)]/60 bg-[var(--card-bg)] px-5 pb-8 pt-5 shadow-[var(--shadow-soft)]">
      <h3 className="text-base font-medium leading-6">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-[var(--text-muted)]">{body}</p>
      {children}
    </div>
  );
}

function PlanTableRow({
  label,
  values,
  active,
  last = false,
}: {
  label: string;
  values: string[];
  active: PlanId;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-[var(--card-border)]"}>
      <td className="px-4 py-3 text-[rgb(104,107,130)]">{label}</td>
      {PLANS.map((p, i) => (
        <td
          key={p.id}
          className={`px-4 py-3 tabular-nums ${
            active === p.id
              ? "font-medium text-[rgb(16,17,20)]"
              : "text-[rgb(72,75,94)]"
          }`}
        >
          {values[i]}
        </td>
      ))}
    </tr>
  );
}
