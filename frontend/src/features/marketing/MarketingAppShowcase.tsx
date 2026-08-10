import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";
import { PhoneFrame } from "./MarketingDevices";
import {
  ActivityScreen,
  MarketsScreen,
  PortfolioScreen,
  TicketScreen,
  TradeScreen,
} from "./MarketingPhoneScreens";

export default function MarketingAppShowcase() {
  return (
    <section
      id="app"
      data-mkt="app-showcase"
      className="marketing-appshowcase scroll-mt-32 overflow-hidden border-y border-[var(--card-border)] py-10"
      aria-labelledby="mkt-app-title"
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            On mobile
          </p>
          <h2
            id="mkt-app-title"
            className="mt-2 text-2xl type-display font-medium text-[var(--text-primary)] sm:text-[28px] sm:leading-8"
          >
            Paper trading on your phone
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
            Check markets, place orders, and review positions on mobile.
          </p>
        </div>

        <div className="marketing-appshowcase__row mt-7">
          <PhoneFrame depth={2} label="Pioni order review on mobile">
            <TicketScreen />
          </PhoneFrame>
          <PhoneFrame depth={1} label="Pioni portfolio on mobile">
            <PortfolioScreen />
          </PhoneFrame>
          <PhoneFrame depth={0} label="Pioni trade ticket on mobile">
            <TradeScreen />
          </PhoneFrame>
          <PhoneFrame depth={1} label="Pioni markets list on mobile">
            <MarketsScreen />
          </PhoneFrame>
          <PhoneFrame depth={2} label="Pioni order activity on mobile">
            <ActivityScreen />
          </PhoneFrame>
        </div>

        <div className="mt-8 text-center">
          <Link
            to={SIGN_UP_PATH}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-5 text-sm font-medium text-[var(--mkt-cta-fg)] hover:opacity-90"
          >
            Start paper trading
          </Link>
        </div>
      </div>
    </section>
  );
}
