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
      className="marketing-desk-gallery scroll-mt-32 border-y border-[var(--card-border)] py-20 sm:py-28"
      aria-labelledby="mkt-desk-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Desk
          </p>
          <h2
            id="mkt-desk-title"
            className="mt-3 text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl sm:leading-[44px]"
          >
            Every surface you need to practice
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            The same ticket, book, chart, and balances you get inside the desk.
            Every number below settles against simulated funds.
          </p>
        </div>

        <div className="marketing-desk-gallery__bento mt-14">
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
