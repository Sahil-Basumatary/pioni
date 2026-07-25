import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { EyeIcon, EyeOffIcon } from "../../components/shell/shellIcons";
import { clerkErrorMessage } from "./authErrors";
import { FORGOT_PASSWORD_PATH, SIGN_UP_PATH } from "./authRoutes";
import { AuthRichText } from "./AuthRichText";
import { useLanguage } from "./LanguageProvider";

const SSO_CALLBACK = "/sso-callback";
const fieldIdle =
  "bg-[rgba(104,107,130,0.04)] hover:bg-[rgba(104,107,130,0.08)] focus-within:bg-[rgba(104,107,130,0.08)] focus-within:outline focus-within:outline-2 focus-within:outline-[#101114] focus-within:outline-offset-0";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn || !setActive) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password,
        strategy: "password",
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate("/home", { replace: true });
        return;
      }
      if (result.status === "needs_second_factor") {
        setError(t("needsSecondFactor"));
        return;
      }
      setError(t("couldntSignIn"));
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(strategy: "oauth_google" | "oauth_x") {
    if (!isLoaded || !signIn) return;
    setError(null);
    setBusy(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: SSO_CALLBACK,
        redirectUrlComplete: "/home",
      });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setBusy(false);
    }
  }

  const forgotHref =
    identifier.trim().includes("@")
      ? `${FORGOT_PASSWORD_PATH}?email=${encodeURIComponent(identifier.trim())}`
      : FORGOT_PASSWORD_PATH;

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] bg-white px-6 py-6 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.svg" alt="" className="h-14 w-auto" />
        <h1 className="text-center text-[28px] font-medium leading-9 tracking-tight text-[#101114]">
          {t("signInTitle")}
        </h1>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-0.5">
          <label
            className={`box-border flex h-[52px] flex-col justify-center overflow-clip rounded-t-[12px] rounded-b-[4px] px-3 ${fieldIdle}`}
          >
            <span className="text-xs leading-4 text-[#686B82]">
              {t("emailOrUsername")}
            </span>
            <input
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#101114] outline-none placeholder:text-[#686B82]"
              required
            />
          </label>
          <label
            className={`box-border flex h-[52px] items-center gap-2 overflow-clip rounded-t-[4px] rounded-b-[12px] px-3 ${fieldIdle}`}
          >
            <span className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="text-xs leading-4 text-[#686B82]">{t("password")}</span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#101114] outline-none"
                required
              />
            </span>
            <button
              type="button"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              onClick={() => setShowPassword((v) => !v)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#686B82] hover:bg-black/[0.04] hover:text-[#101114]"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </label>
        </div>
        <p className="text-sm text-[#686B82]">
          <AuthRichText
            id="forgotPasswordOrUsername"
            values={{
              password: (
                <Link
                  to={forgotHref}
                  className="font-medium text-[#101114] underline-offset-2 hover:underline"
                >
                  {t("passwordLink")}
                </Link>
              ),
              username: (
                <Link
                  to={FORGOT_PASSWORD_PATH}
                  className="font-medium text-[#101114] underline-offset-2 hover:underline"
                >
                  {t("usernameLink")}
                </Link>
              ),
            }}
          />
        </p>
        {error ? (
          <p className="text-sm text-[rgb(209,29,69)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !isLoaded}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#101114] text-base font-medium text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {t("continue")}
        </button>
      </form>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(104,107,130,0.16)]" />
        <span className="text-sm text-[#686B82]">{t("or")}</span>
        <div className="h-px flex-1 bg-[rgba(104,107,130,0.16)]" />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !isLoaded}
          onClick={() => void onOAuth("oauth_google")}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] text-base font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)] disabled:opacity-60"
        >
          {t("signInWithGoogle")}
        </button>
        <button
          type="button"
          disabled={busy || !isLoaded}
          onClick={() => void onOAuth("oauth_x")}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] text-base font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)] disabled:opacity-60"
        >
          {t("signInWithX")}
        </button>
      </div>
      <p className="text-center text-sm text-[#686B82]">
        {t("noAccount")}{" "}
        <Link
          to={SIGN_UP_PATH}
          className="font-medium text-[#101114] underline-offset-2 hover:underline"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
