import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetPricesQuery } from "../market/marketApi";
import MarketingCategoryRail from "./MarketingCategoryRail";
import MarketingCategorySections from "./MarketingCategorySections";
import MarketingFloatMarkets, { COLLAPSED_ROWS } from "./MarketingFloatMarkets";
import MarketingIntegrityStrip from "./MarketingIntegrityStrip";
import MarketingSideRails from "./MarketingSideRails";
import {
  filterByChip,
  toLiveRows,
  type MarketingChipId,
} from "./marketingLiveRows";

export default function MarketingLiveMarkets() {
  const [chip, setChip] = useState<MarketingChipId>("all");
  const repositionAfterFilter = useRef(false);

  const selectChip = useCallback((id: MarketingChipId) => {
    repositionAfterFilter.current = true;
    setChip(id);
  }, []);

  /* Re-anchor after a filter shortens the feed above the viewport. */
  useEffect(() => {
    if (!repositionAfterFilter.current) return;
    repositionAfterFilter.current = false;
    const feed = document.getElementById("markets");
    if (!feed) return;
    const { top } = feed.getBoundingClientRect();
    if (top >= 0 && top <= window.innerHeight) return;
    /* ScrollTrigger refresh cancels an in-flight smooth scroll. */
    feed.scrollIntoView({ block: "start" });
  }, [chip]);
  const { data: prices } = useGetPricesQuery(undefined, {
    pollingInterval: 30_000,
  });

  const rows = useMemo(() => toLiveRows(prices), [prices]);
  const filtered = useMemo(() => filterByChip(rows, chip), [rows, chip]);
  const onScreen = useMemo(
    () => new Set(filtered.slice(0, COLLAPSED_ROWS).map((row) => row.symbol)),
    [filtered],
  );

  return (
    <div data-mkt="live-markets">
      <div className="sticky top-16 z-[5] bg-[var(--mkt-scrim)] backdrop-blur-sm">
        <MarketingCategoryRail active={chip} onChange={selectChip} />
      </div>
      <div className="marketing-feed mx-auto w-full max-w-[1320px] px-4 pb-10 pt-4 sm:px-6">
        <div className="marketing-feed__layout">
          <div className="marketing-feed__main min-w-0">
            <MarketingIntegrityStrip />
            <MarketingFloatMarkets key={chip} rows={filtered} allRows={rows} chip={chip} />
            {chip === "all" ? (
              <MarketingCategorySections
                rows={rows}
                exclude={onScreen}
                onSelectCategory={selectChip}
              />
            ) : null}
          </div>
          <MarketingSideRails rows={rows} />
        </div>
      </div>
    </div>
  );
}
