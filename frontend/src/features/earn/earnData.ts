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
  nextPayoutLabel: "in 3 hours",
} as const;

export const FOR_YOU = {
  title: "Earn with Staking",
  apy: 0.04,
  assetName: "Bitcoin",
  availableLabel: "0.00091 BTC available",
} as const;

export const READY_ASSETS: EarnAsset[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    apy: 0.04,
    available: 0.00091,
    availableUsd: 57.88,
    icon: "/icons/assets/btc.webp",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    apy: 2.15,
    available: 0.12,
    availableUsd: 312.4,
    icon: "/icons/assets/eth.webp",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    apy: 5.8,
    available: 4.25,
    availableUsd: 612.75,
    icon: "/icons/assets/sol.webp",
  },
  {
    id: "ada",
    symbol: "ADA",
    name: "Cardano",
    apy: 2.9,
    available: 420,
    availableUsd: 184.8,
    icon: "/icons/assets/ada.webp",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    apy: 1.2,
    available: 250,
    availableUsd: 137.5,
    icon: "/icons/assets/xrp.webp",
  },
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
