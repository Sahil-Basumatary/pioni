export type GlossaryTermId =
  | "limit_order"
  | "market_order"
  | "spread"
  | "order_book"
  | "available_to_trade"
  | "post_only"
  | "time_in_force"
  | "maker_fee"
  | "unrealized_pnl"
  | "volume_24h"
  | "tp_sl"
  | "required_margin"
  | "index_price"
  | "last_price"
  | "change_24h"
  | "high_24h"
  | "low_24h"
  | "funding_rate"
  | "reduce_only"
  | "margin_health"
  | "liquidation"
  | "trading_fee"
  | "fees"
  | "entry_price"
  | "mark_price"
  | "book_grouping";

export type GlossaryEntry = {
  title: string;
  body: string;
};

export const GLOSSARY: Record<GlossaryTermId, GlossaryEntry> = {
  limit_order: {
    title: "Limit order",
    body: "You pick the price. The order waits until the market reaches it — or you cancel. Good when you’re not in a rush.",
  },
  market_order: {
    title: "Market order",
    body: "Buys or sells right away at the best available price. Faster, but you don’t choose the exact fill price.",
  },
  spread: {
    title: "Spread",
    body: "The gap between the highest buy price and the lowest sell price. A tighter spread usually means a more liquid market.",
  },
  order_book: {
    title: "Order book",
    body: "Live list of resting buy and sell orders. Bids are buyers; asks are sellers. Depth shows how much size sits at each price.",
  },
  available_to_trade: {
    title: "Available to trade",
    body: "Paper cash (or asset) you can use on this ticket right now. Practice funds only — not real money.",
  },
  post_only: {
    title: "Post only",
    body: "Only places the order if it rests on the book (maker). If it would fill immediately, it’s rejected instead of taking liquidity.",
  },
  time_in_force: {
    title: "Time in force",
    body: "How long the order stays open. GTC (good till canceled) rests until it fills or you cancel it.",
  },
  maker_fee: {
    title: "Maker fee",
    body: "Fee when your order adds liquidity (rests on the book). Paper trading here is 0% so you can practice without cost.",
  },
  unrealized_pnl: {
    title: "Unrealized P&L",
    body: "Paper profit or loss on an open position if you closed it at the current mark price. It changes as the market moves.",
  },
  volume_24h: {
    title: "24H volume",
    body: "How much of this market traded in the last 24 hours. Higher volume usually means easier fills.",
  },
  tp_sl: {
    title: "TP/SL",
    body: "Take-profit / stop-loss. Optional exits that aim to lock gains or cut losses after you’re in a position.",
  },
  required_margin: {
    title: "Required margin",
    body: "Paper collateral set aside for a leveraged order. Not the full notional — leverage lets you control more size with less cash.",
  },
  index_price: {
    title: "Index price",
    body: "A fair reference price built from multiple market sources. Used to mark positions so one venue’s spike doesn’t distort P&L.",
  },
  last_price: {
    title: "Last price",
    body: "The most recent trade price in this market. It updates as fills happen.",
  },
  change_24h: {
    title: "24H change",
    body: "How much the price moved over the last 24 hours, in dollars and percent.",
  },
  high_24h: {
    title: "24H high",
    body: "The highest trade price seen in the last 24 hours.",
  },
  low_24h: {
    title: "24H low",
    body: "The lowest trade price seen in the last 24 hours.",
  },
  funding_rate: {
    title: "Funding rate",
    body: "A periodic paper payment between longs and shorts on perpetuals. Positive usually means longs pay shorts.",
  },
  reduce_only: {
    title: "Reduce only",
    body: "The order can only shrink or close a position — it won’t open or increase one by mistake.",
  },
  margin_health: {
    title: "Margin health",
    body: "A quick check that your paper collateral covers this order. “Healthy” means you’re not overextended on this ticket.",
  },
  liquidation: {
    title: "Est. liquidation",
    body: "Rough price where a leveraged paper position would be force-closed if losses eat too much margin. Display-only for now.",
  },
  trading_fee: {
    title: "Est. trading fee",
    body: "Estimated fee for this order. On paper spot it’s 0% so practice stays free.",
  },
  fees: {
    title: "Fees",
    body: "Maker / taker fee rates. Maker adds liquidity; taker takes it. Paper spot is 0% / 0%.",
  },
  entry_price: {
    title: "Entry",
    body: "Average price you got into this paper position. P&L is measured against this level.",
  },
  mark_price: {
    title: "Mark",
    body: "The price used to value your open position right now — usually tied to index, not just the last trade.",
  },
  book_grouping: {
    title: "Grouping",
    body: "Rounds nearby prices into buckets so the book is easier to read. Smaller steps = more detail.",
  },
};
