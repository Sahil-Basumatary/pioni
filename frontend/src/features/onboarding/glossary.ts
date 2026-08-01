import type { MessageKey } from "../i18n/translate";

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
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

export const GLOSSARY: Record<GlossaryTermId, GlossaryEntry> = {
  limit_order: {
    titleKey: "glossaryLimitOrderTitle",
    bodyKey: "glossaryLimitOrderBody",
  },
  market_order: {
    titleKey: "glossaryMarketOrderTitle",
    bodyKey: "glossaryMarketOrderBody",
  },
  spread: {
    titleKey: "glossarySpreadTitle",
    bodyKey: "glossarySpreadBody",
  },
  order_book: {
    titleKey: "glossaryOrderBookTitle",
    bodyKey: "glossaryOrderBookBody",
  },
  available_to_trade: {
    titleKey: "glossaryAvailableToTradeTitle",
    bodyKey: "glossaryAvailableToTradeBody",
  },
  post_only: {
    titleKey: "glossaryPostOnlyTitle",
    bodyKey: "glossaryPostOnlyBody",
  },
  time_in_force: {
    titleKey: "glossaryTimeInForceTitle",
    bodyKey: "glossaryTimeInForceBody",
  },
  maker_fee: {
    titleKey: "glossaryMakerFeeTitle",
    bodyKey: "glossaryMakerFeeBody",
  },
  unrealized_pnl: {
    titleKey: "glossaryUnrealizedPnlTitle",
    bodyKey: "glossaryUnrealizedPnlBody",
  },
  volume_24h: {
    titleKey: "glossaryVolume24hTitle",
    bodyKey: "glossaryVolume24hBody",
  },
  tp_sl: {
    titleKey: "glossaryTpSlTitle",
    bodyKey: "glossaryTpSlBody",
  },
  required_margin: {
    titleKey: "glossaryRequiredMarginTitle",
    bodyKey: "glossaryRequiredMarginBody",
  },
  index_price: {
    titleKey: "glossaryIndexPriceTitle",
    bodyKey: "glossaryIndexPriceBody",
  },
  last_price: {
    titleKey: "glossaryLastPriceTitle",
    bodyKey: "glossaryLastPriceBody",
  },
  change_24h: {
    titleKey: "glossaryChange24hTitle",
    bodyKey: "glossaryChange24hBody",
  },
  high_24h: {
    titleKey: "glossaryHigh24hTitle",
    bodyKey: "glossaryHigh24hBody",
  },
  low_24h: {
    titleKey: "glossaryLow24hTitle",
    bodyKey: "glossaryLow24hBody",
  },
  funding_rate: {
    titleKey: "glossaryFundingRateTitle",
    bodyKey: "glossaryFundingRateBody",
  },
  reduce_only: {
    titleKey: "glossaryReduceOnlyTitle",
    bodyKey: "glossaryReduceOnlyBody",
  },
  margin_health: {
    titleKey: "glossaryMarginHealthTitle",
    bodyKey: "glossaryMarginHealthBody",
  },
  liquidation: {
    titleKey: "glossaryLiquidationTitle",
    bodyKey: "glossaryLiquidationBody",
  },
  trading_fee: {
    titleKey: "glossaryTradingFeeTitle",
    bodyKey: "glossaryTradingFeeBody",
  },
  fees: {
    titleKey: "glossaryFeesTitle",
    bodyKey: "glossaryFeesBody",
  },
  entry_price: {
    titleKey: "glossaryEntryPriceTitle",
    bodyKey: "glossaryEntryPriceBody",
  },
  mark_price: {
    titleKey: "glossaryMarkPriceTitle",
    bodyKey: "glossaryMarkPriceBody",
  },
  book_grouping: {
    titleKey: "glossaryBookGroupingTitle",
    bodyKey: "glossaryBookGroupingBody",
  },
};
