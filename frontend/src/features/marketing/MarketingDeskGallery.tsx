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
      className="marketing-desk-gallery scroll-mt-32 border-y border-[var(--card-border)] pb-28 pt-24 sm:pb-32 sm:pt-28"
      aria-labelledby="mkt-desk-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Inside Pioni
          </p>
          <h2
            id="mkt-desk-title"
            className="mt-3 text-3xl type-display font-medium text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
          >
            Everything stays in one desk
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            Place an order, follow the book, read the chart, and check your balance
            without switching views.
          </p>
        </div>

        <div className="marketing-desk-gallery__bento mt-12 sm:mt-16">
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
