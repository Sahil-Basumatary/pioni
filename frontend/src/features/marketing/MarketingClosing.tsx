import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingClosing() {
  return (
    <section
      data-mkt="closing"
      className="marketing-closing pb-28 pt-24 text-center sm:pb-32 sm:pt-28"
      aria-labelledby="mkt-closing-title"
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h2
          id="mkt-closing-title"
          className="text-3xl type-display font-medium text-white sm:text-5xl sm:leading-[56px]"
        >
          Ready to place your first paper trade?
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/65">
          Create an account. We will add the simulated funds and take you straight
          to the desk.
        </p>
        <Link
          to={SIGN_UP_PATH}
          className="mt-10 inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-6 text-sm font-semibold text-[var(--mkt-cta-fg)] hover:opacity-90"
        >
          Start paper trading
        </Link>
        <p className="mt-5 text-sm text-white/45">No deposit. No real money.</p>
      </div>
    </section>
  );
}
