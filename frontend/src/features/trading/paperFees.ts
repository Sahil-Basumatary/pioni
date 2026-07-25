import type { TradingVenue } from "./tradingVenue";

/** Displayed fee schedule. Fills are booked at zero fee — see the orders service. */
export const PAPER_FEES: Record<TradingVenue, { maker: string; taker: string }> = {
  spot: { maker: "0.00%", taker: "0.00%" },
  margin: { maker: "0.00%", taker: "0.00%" },
  futures: { maker: "0.0200%", taker: "0.0500%" },
};

export function paperFees(venue: TradingVenue = "spot") {
  return PAPER_FEES[venue];
}
