import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../auth/authRoutes";

export default function MarketingClosing() {
  return (
    <section
      data-mkt="closing"
      className="marketing-closing py-20 text-center sm:py-28"
      aria-labelledby="mkt-closing-title"
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h2
          id="mkt-closing-title"
          className="text-3xl font-normal tracking-tight text-white sm:text-5xl sm:leading-[56px]"
        >
          Make your first move
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65">
          Create a free account and open the desk with simulated funds. No real
          money at risk.
        </p>
        <Link
          to={SIGN_UP_PATH}
          className="mt-9 inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[#101114] hover:bg-white/90"
        >
          Create account
        </Link>
        <p className="mt-6 text-sm text-white/45">
          Simulated funds only. Not investment advice.
        </p>
      </div>
    </section>
  );
}
