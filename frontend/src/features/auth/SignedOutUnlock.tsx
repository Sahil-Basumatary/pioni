import { Link } from "react-router-dom";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "./authRoutes";

type SignedOutUnlockProps = {
  size?: "compact" | "panel" | "page";
  showLogo?: boolean;
};

export default function SignedOutUnlock({
  size = "compact",
  showLogo = false,
}: SignedOutUnlockProps) {
  const pad =
    size === "page" ? "px-4 py-16" : size === "panel" ? "px-4 py-12" : "px-4 py-8";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-center ${pad} ${
        size === "page" ? "min-h-[min(560px,70dvh)] w-full" : ""
      }`}
    >
      {showLogo ? (
        <img src="/logo.svg" alt="" className="h-40 w-40 object-contain" />
      ) : null}
      <p className="flex max-w-md flex-wrap items-center justify-center gap-1 text-base leading-6 text-[#101114]">
        <span>Unlock everything Pioni has to offer.</span>
        <Link
          to={SIGN_IN_PATH}
          className="text-[#101114] underline underline-offset-2 hover:text-[rgb(72,75,94)]"
        >
          Sign in
        </Link>
        <span>or</span>
        <Link
          to={SIGN_UP_PATH}
          className="text-[#101114] underline underline-offset-2 hover:text-[rgb(72,75,94)]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
