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
import {
  PLAN_RULES,
  WALLET_SIZES,
  formatWallet,
  plansForWallet,
  resolvePlanId,
  type PlanId,
  type WalletSize,
} from "../features/prop/propPlans";

type BenefitIcon = ComponentType<SVGProps<SVGSVGElement>>;

const BENEFITS: { title: string; body: string; Icon: BenefitIcon }[] = [
  {
    title: "Concept preview",
    body: "Explore a proposed prop evaluation flow. No program is currently offered.",
    Icon: PropBillIcon,
  },
  {
    title: "Example rules",
    body: "Review sample profit targets, daily loss limits, and drawdown limits.",
    Icon: PropFileTextIcon,
  },
  {
    title: "No payment",
    body: "Evaluations cannot be purchased and no payment details are collected.",
    Icon: PropBalanceIcon,
  },
  {
    title: "No payouts",
    body: "The payout screen is a visual preview. No funds can be withdrawn.",
    Icon: PropWithdrawIcon,
  },
  {
    title: "Simulated trading",
    body: "All balances, trades, evaluation results, and account values are simulated.",
    Icon: PropExpandIcon,
  },
  {
    title: "Not live",
    body: "Pioni does not issue funded wallets or provide company capital.",
    Icon: PropShieldTickIcon,
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is prop trading?",
    a: "Prop trading uses a firm's capital under defined risk limits. Pioni Prop is only a concept preview. Pioni does not provide capital, funded wallets, or profit sharing.",
  },
  {
    q: "How does Pioni Prop differ from trading on Pioni?",
    a: "This page previews evaluation rules and screens. The rest of Pioni provides paper trading with simulated balances.",
  },
  {
    q: "Can I buy an evaluation?",
    a: "No. Evaluations and fees shown on this page are examples. Pioni does not accept payment for a prop program.",
  },
  {
    q: "Is the evaluation time-limited?",
    a: "The example plans do not include a time limit. No evaluation can currently be started.",
  },
  {
    q: "What are the risk limits?",
    a: "The example plans show a daily loss limit and maximum drawdown. These limits are not part of a live program.",
  },
  {
    q: "What if I don’t pass the evaluation?",
    a: "Nothing happens because the evaluation is not available. This page does not create or close wallets.",
  },
  {
    q: "Can I receive funding or a payout?",
    a: "No. Pioni does not provide trading capital, funded wallets, profit shares, or payouts.",
  },
];

export default function PropPage() {
  const [walletSize, setWalletSize] = useState<WalletSize>(10_000);
  const [planId, setPlanId] = useState<PlanId>("starter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const plans = useMemo(() => plansForWallet(walletSize), [walletSize]);
  const activePlanId = resolvePlanId(planId, walletSize);
  const plan = useMemo(
    () => plans.find((p) => p.id === activePlanId) ?? plans[0],
    [plans, activePlanId],
  );

  const selectWallet = (size: WalletSize) => {
    setWalletSize(size);
    setPlanId((current) => resolvePlanId(current, size));
  };

  const selectPlan = (id: PlanId) => {
    if (!plans.find((p) => p.id === id)?.available) return;
    setPlanId(id);
  };

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
              Pioni Prop is a concept preview
            </p>
            <p className="text-[rgb(72,75,94)]">
              Evaluations, funded wallets, and payouts are not available
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[rgb(0,121,180)] px-2 text-xs font-medium text-white hover:bg-[rgb(0,105,158)]"
        >
          Not available
        </button>
      </div>

      <header className="mb-14 flex flex-col items-center text-center">
        <h1 className="text-[48px] font-normal leading-[56px] tracking-tight">
          Preview a prop evaluation
        </h1>
        <p className="mt-5 whitespace-pre-wrap text-[20px] font-normal leading-7 text-[rgb(16,17,20)]">
          {"Review example plans and risk limits.\nNo fees, funding, or payouts are available."}
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
            title="Review an example plan"
            body="See sample targets and loss limits. You cannot buy this evaluation."
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
                Unavailable
              </button>
            </PropStepGlass>
          </HowCard>
          <HowCard
            title="Preview a result"
            body="See how a passed evaluation could appear. No funded wallet is issued."
          >
            <PropStepGlass className="items-center justify-center gap-3 px-4 py-5 text-center">
              <PropFundedMark />
              <div className="text-sm font-medium leading-5 text-[var(--text-primary)]">
                <p>Example result</p>
                <p>Evaluation passed</p>
              </div>
            </PropStepGlass>
          </HowCard>
          <HowCard
            title="Preview a payout"
            body="Review the example payout interface. No funds can be withdrawn."
          >
            <PropStepGlass>
              <p className="text-xs leading-4 text-[var(--text-muted)]">
                Example{" "}
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
          Choose an example wallet size
        </h2>
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl bg-[rgba(104,107,130,0.08)] p-1">
          {WALLET_SIZES.map((size) => {
            const active = size === walletSize;
            return (
              <button
                key={size}
                type="button"
                onClick={() => selectWallet(size)}
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
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      disabled={!p.available}
                      onClick={() => selectPlan(p.id)}
                      className={`rail-icon ${
                        !p.available
                          ? "cursor-not-allowed text-[rgb(104,107,130)]/50"
                          : activePlanId === p.id
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
                values={plans.map((p) => p.targetProfit)}
                active={activePlanId}
                available={plans.map((p) => p.available)}
              />
              <PlanTableRow
                label="Max daily loss"
                values={plans.map((p) => p.maxDailyLoss)}
                active={activePlanId}
                available={plans.map((p) => p.available)}
              />
              <PlanTableRow
                label="Max drawdown"
                values={plans.map((p) => p.maxDrawdown)}
                active={activePlanId}
                available={plans.map((p) => p.available)}
              />
              <PlanTableRow
                label="Example fee"
                values={plans.map((p) => p.evaluationFee)}
                active={activePlanId}
                available={plans.map((p) => p.available)}
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
  available,
  last = false,
}: {
  label: string;
  values: string[];
  active: PlanId;
  available: boolean[];
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-[var(--card-border)]"}>
      <td className="px-4 py-3 text-[rgb(104,107,130)]">{label}</td>
      {PLAN_RULES.map((p, i) => (
        <td
          key={p.id}
          className={`px-4 py-3 tabular-nums ${
            !available[i]
              ? "text-[rgb(104,107,130)]/50"
              : active === p.id
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
