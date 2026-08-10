import {
  ChartPanel,
  OrderBookPanel,
  OrderTicketPanel,
  PositionsPanel,
} from "./MarketingDeskPanels";

export default function MarketingDeskGallery() {
  return (
    <section
      id="desk"
      data-mkt="desk-gallery"
      className="marketing-desk-gallery scroll-mt-32 border-y border-[var(--card-border)] py-10"
      aria-labelledby="mkt-desk-title"
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Inside Pioni
          </p>
          <h2
            id="mkt-desk-title"
            className="mt-2 text-2xl type-display font-medium text-[var(--text-primary)] sm:text-[28px] sm:leading-8"
          >
            One desk for every order
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
            Chart, order book, ticket, and positions stay in one workspace.
          </p>
        </div>

        <div className="marketing-desk-gallery__bento mt-5">
          <div className="marketing-desk-gallery__cell" data-cell="ticket">
            <OrderTicketPanel />
          </div>
          <div className="marketing-desk-gallery__cell" data-cell="chart">
            <ChartPanel />
          </div>
          <div className="marketing-desk-gallery__cell" data-cell="book">
            <OrderBookPanel />
          </div>
          <div className="marketing-desk-gallery__cell" data-cell="positions">
            <PositionsPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
