import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingClosing() {
  return (
    <section
      data-mkt="closing"
      className="marketing-closing py-12 text-center"
      aria-labelledby="mkt-closing-title"
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h2
          id="mkt-closing-title"
          className="text-2xl type-display font-medium text-white sm:text-[28px] sm:leading-8"
        >
          Ready to place your first paper trade?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-white/65">
          Create an account. Practice USD is included.
        </p>
        <Link
          to={SIGN_UP_PATH}
          className="mt-5 inline-flex h-10 min-w-[160px] items-center justify-center rounded-xl bg-[var(--mkt-cta-bg)] px-5 text-sm font-semibold text-[var(--mkt-cta-fg)] hover:opacity-90"
        >
          Start paper trading
        </Link>
      </div>
    </section>
  );
}
