import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGetPricesQuery } from "../market/marketApi";
import MarketingCategoryRail from "./MarketingCategoryRail";
import MarketingFeaturedMarket from "./MarketingFeaturedMarket";
import MarketingFloatMarkets from "./MarketingFloatMarkets";
import {
  featuredRow,
  filterByChip,
  toLiveRows,
  type MarketingChipId,
} from "./marketingLiveRows";

export default function MarketingLiveMarkets() {
  const [chip, setChip] = useState<MarketingChipId>("all");
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });

  const rows = useMemo(() => toLiveRows(prices), [prices]);
  const filtered = useMemo(() => filterByChip(rows, chip), [rows, chip]);
  const featured = useMemo(() => featuredRow(filtered.length ? filtered : rows), [
    filtered,
    rows,
  ]);

  return (
    <div data-mkt="live-markets">
      <div className="sticky top-16 z-[5] bg-[var(--mkt-scrim)] backdrop-blur-sm">
        <MarketingCategoryRail active={chip} onChange={setChip} />
      </div>
      <div className="marketing-plane-slot marketing-plane-slot--featured">
        <MarketingFeaturedMarket row={featured} />
      </div>
      <div className="marketing-plane-slot marketing-plane-slot--markets">
        <MarketingFloatMarkets rows={filtered} chip={chip} />
      </div>
      <div className="relative z-[3] mx-auto w-full max-w-7xl px-4 pb-16 pt-2 text-center sm:px-6">
        <Link
          to="/trading"
          className="text-sm font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
        >
          Browse all markets on the desk
        </Link>
      </div>
    </div>
  );
}
