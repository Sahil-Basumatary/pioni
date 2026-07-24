export type PaperLimitCard = {
  id: string;
  title: string;
  asset: "Fiat" | "Crypto";
  direction: "Deposit" | "Withdrawal";
  remaining: string;
  used: string;
  period: string;
  note: string;
};

export const PAPER_LIMIT_CARDS: PaperLimitCard[] = [
  {
    id: "fiat-deposit",
    title: "Fiat deposits",
    asset: "Fiat",
    direction: "Deposit",
    remaining: "Unlimited",
    used: "$0.00",
    period: "Rolling 24 hours",
    note: "Paper deposits are simulated. No funding caps apply.",
  },
  {
    id: "fiat-withdrawal",
    title: "Fiat withdrawals",
    asset: "Fiat",
    direction: "Withdrawal",
    remaining: "Not applicable",
    used: "$0.00",
    period: "Rolling 24 hours",
    note: "Paper accounts cannot withdraw real funds.",
  },
  {
    id: "crypto-deposit",
    title: "Crypto deposits",
    asset: "Crypto",
    direction: "Deposit",
    remaining: "Unlimited",
    used: "0 BTC",
    period: "Rolling 24 hours",
    note: "Paper deposits are simulated. No funding caps apply.",
  },
  {
    id: "crypto-withdrawal",
    title: "Crypto withdrawals",
    asset: "Crypto",
    direction: "Withdrawal",
    remaining: "Not applicable",
    used: "0 BTC",
    period: "Rolling 24 hours",
    note: "Paper accounts cannot withdraw real funds.",
  },
];
