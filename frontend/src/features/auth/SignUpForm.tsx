import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { EyeIcon, EyeOffIcon } from "../../components/shell/shellIcons";
import { clerkErrorMessage } from "./authErrors";
import { SIGN_IN_PATH } from "./authRoutes";
import { useLanguage } from "./LanguageProvider";

const SSO_CALLBACK = "/sso-callback";
const fieldIdle =
  "bg-[rgba(104,107,130,0.04)] hover:bg-[rgba(104,107,130,0.08)] focus-within:bg-[rgba(104,107,130,0.08)] focus-within:outline focus-within:outline-2 focus-within:outline-[#101114] focus-within:outline-offset-0";

type Step = "create" | "verify";

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("create");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive) return;
    setError(null);
    setBusy(true);
    try {
      const created = await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      if (created.status === "complete" && created.createdSessionId) {
        await setActive({ session: created.createdSessionId });
        navigate("/home", { replace: true });
        return;
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate("/home", { replace: true });
        return;
      }
      setError(t("couldntVerify"));
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(strategy: "oauth_google" | "oauth_x") {
    if (!isLoaded || !signUp) return;
    setError(null);
    setBusy(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: SSO_CALLBACK,
        redirectUrlComplete: "/home",
      });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] bg-white px-6 py-6 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo.svg" alt="" className="h-14 w-auto" />
        <h1 className="text-center text-[28px] font-medium leading-9 tracking-tight text-[#101114]">
          {t("createAccountTitle")}
        </h1>
        <p className="text-center text-sm text-[#686B82]">{t("signUpSubtitle")}</p>
      </div>
      {step === "create" ? (
        <>
          <form className="flex flex-col gap-4" onSubmit={onCreate} noValidate>
            <div className="flex flex-col gap-0.5">
              <label
                className={`box-border flex h-[52px] flex-col justify-center overflow-clip rounded-t-[12px] rounded-b-[4px] px-3 ${fieldIdle}`}
              >
                <span className="text-xs leading-4 text-[#686B82]">{t("email")}</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-[#101114] outline-none"
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
                    autoComplete="new-password"
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
              {t("signUpWithGoogle")}
            </button>
            <button
              type="button"
              disabled={busy || !isLoaded}
              onClick={() => void onOAuth("oauth_x")}
              className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] text-base font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)] disabled:opacity-60"
            >
              {t("signUpWithX")}
            </button>
          </div>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onVerify} noValidate>
          <p className="text-sm text-[#686B82]">
            {t("verifyEmailBlurb", {
              email: email.trim() || t("yourEmail"),
            })}
          </p>
          <label
            className={`box-border flex h-[52px] flex-col justify-center overflow-clip rounded-xl px-3 ${fieldIdle}`}
          >
            <span className="text-xs leading-4 text-[#686B82]">
              {t("verificationCode")}
            </span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#101114] outline-none"
              required
            />
          </label>
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
            {t("verifyEmail")}
          </button>
          <button
            type="button"
            className="text-sm font-medium text-[#686B82] hover:text-[#101114]"
            onClick={() => {
              setStep("create");
              setCode("");
              setError(null);
            }}
          >
            {t("useDifferentEmail")}
          </button>
        </form>
      )}
      <p className="text-center text-sm text-[#686B82]">
        {t("hasAccount")}{" "}
        <Link
          to={SIGN_IN_PATH}
          className="font-medium text-[#101114] underline-offset-2 hover:underline"
        >
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
