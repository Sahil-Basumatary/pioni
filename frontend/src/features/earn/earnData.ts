export type EarnAsset = {
  id: string;
  symbol: string;
  name: string;
  apy: number;
  available: number;
  availableUsd: number;
  icon: string;
};

export type EarnPayout = {
  id: string;
  asset: string;
  amount: number;
  amountUsd: number | null;
  dateLabel: string;
  timeLabel: string;
};

export const EARN_SUMMARY = {
  balanceUsd: 0,
  autoEarnPct: 0,
  estAnnualUsd: 0.005,
  lifetimeUsd: 0.01,
  last30dUsd: 0,
  nextPayoutLabel: "in 2 days",
} as const;

export const FOR_YOU = {
  title: "Earn with Staking",
  apy: 0.05,
  assetName: "Bitcoin",
  availableLabel: "0.00091 BTC available",
} as const;

export const READY_ASSETS: EarnAsset[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    apy: 0.05,
    available: 0.00091,
    availableUsd: 60.49,
    icon: "/icons/assets/btc.webp",
  },
];

export type BuyEarnAsset = {
  id: string;
  name: string;
  apy: number;
  priceUsd: number;
};

export const BUY_ASSETS: BuyEarnAsset[] = [
  { id: "dym", name: "Dymension", apy: 24.3, priceUsd: 0.01 },
  { id: "atom", name: "Cosmos", apy: 19.94, priceUsd: 1.46 },
  { id: "scrt", name: "Secret Network", apy: 18.89, priceUsd: 0.04 },
  { id: "flow", name: "Flow", apy: 18.57, priceUsd: 0.02 },
  { id: "ksm", name: "Kusama", apy: 17.12, priceUsd: 3.24 },
];

export const EARN_PAYOUTS: EarnPayout[] = [
  {
    id: "LHULVP",
    asset: "Babylon",
    amount: 0.01571,
    amountUsd: 0.000204,
    dateLabel: "7/10/26",
    timeLabel: "4:57 PM",
  },
  {
    id: "LL4RV3",
    asset: "Babylon",
    amount: 0.0159,
    amountUsd: null,
    dateLabel: "7/3/26",
    timeLabel: "4:57 PM",
  },
  {
    id: "LU65BT",
    asset: "Babylon",
    amount: 0.0157,
    amountUsd: null,
    dateLabel: "6/26/26",
    timeLabel: "4:59 PM",
  },
  {
    id: "LRITXS",
    asset: "Babylon",
    amount: 0.01613,
    amountUsd: null,
    dateLabel: "6/19/26",
    timeLabel: "4:58 PM",
  },
  {
    id: "LV7QDS",
    asset: "Babylon",
    amount: 0.01662,
    amountUsd: null,
    dateLabel: "6/12/26",
    timeLabel: "4:59 PM",
  },
];

export function formatUsd(n: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && n > 0 && n < 0.01) return "<0.01 USD";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export function formatApy(n: number): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatAssetQty(n: number, symbol: string): string {
  const digits = n < 1 ? 5 : 2;
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${symbol}`;
}
