export const WALLET_SIZES = [5_000, 10_000, 25_000, 50_000, 100_000, 200_000] as const;

export type WalletSize = (typeof WALLET_SIZES)[number];
export type PlanId = "starter" | "intermediate" | "advanced";

export type PlanRules = {
  id: PlanId;
  label: string;
  targetProfit: string;
  maxDailyLoss: string;
  maxDrawdown: string;
};

export const PLAN_RULES: PlanRules[] = [
  {
    id: "starter",
    label: "Starter",
    targetProfit: "10%",
    maxDailyLoss: "3%",
    maxDrawdown: "6%",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    targetProfit: "12%",
    maxDailyLoss: "3%",
    maxDrawdown: "5%",
  },
  {
    id: "advanced",
    label: "Advanced",
    targetProfit: "9%",
    maxDailyLoss: "3%",
    maxDrawdown: "3%",
  },
];

/** Base evaluation fees (80% split) by wallet size. Starter has no $200k tier. */
export const EVALUATION_FEES: Record<
  WalletSize,
  Partial<Record<PlanId, number>>
> = {
  5_000: { starter: 45, intermediate: 33, advanced: 20 },
  10_000: { starter: 85, intermediate: 65, advanced: 40 },
  25_000: { starter: 215, intermediate: 150, advanced: 95 },
  50_000: { starter: 400, intermediate: 280, advanced: 180 },
  100_000: { starter: 800, intermediate: 545, advanced: 330 },
  200_000: { intermediate: 1090, advanced: 660 },
};

export function formatWallet(n: number): string {
  return `${n.toLocaleString("en-US")} USD`;
}

export function formatEvaluationFee(amount: number | undefined): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export function isPlanAvailable(planId: PlanId, walletSize: WalletSize): boolean {
  return EVALUATION_FEES[walletSize][planId] != null;
}

export function plansForWallet(walletSize: WalletSize) {
  return PLAN_RULES.map((plan) => ({
    ...plan,
    evaluationFee: formatEvaluationFee(EVALUATION_FEES[walletSize][plan.id]),
    available: isPlanAvailable(plan.id, walletSize),
  }));
}

export function resolvePlanId(
  planId: PlanId,
  walletSize: WalletSize,
): PlanId {
  if (isPlanAvailable(planId, walletSize)) return planId;
  return (
    PLAN_RULES.find((p) => isPlanAvailable(p.id, walletSize))?.id ?? "intermediate"
  );
}
