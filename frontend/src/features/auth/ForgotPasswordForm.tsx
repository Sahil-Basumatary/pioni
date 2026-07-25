import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { EyeIcon, EyeOffIcon } from "../../components/shell/shellIcons";
import { clerkErrorMessage } from "./authErrors";
import { useLanguage } from "./LanguageProvider";

const fieldIdle =
  "bg-[rgba(104,107,130,0.08)] hover:bg-[rgba(104,107,130,0.12)] focus-within:bg-[rgba(104,107,130,0.12)] focus-within:outline focus-within:outline-2 focus-within:outline-[#101114] focus-within:outline-offset-0";

type Step = "request" | "reset";

export default function ForgotPasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(() => params.get("email")?.trim() ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep("reset");
      setInfo(t("checkEmailForCode"));
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn || !setActive) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
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
      setError(t("couldntReset"));
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] bg-white px-6 py-6 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] font-medium leading-8 tracking-tight text-[#101114]">
          {t("forgotTitle")}
        </h1>
        <p className="text-sm leading-5 text-[#686B82]">
          {step === "request" ? t("forgotBlurb") : t("forgotResetBlurb")}
        </p>
      </div>
      {step === "request" ? (
        <form className="flex flex-col gap-4" onSubmit={onRequest} noValidate>
          <label
            className={`relative box-border flex h-[52px] items-center overflow-clip rounded-xl px-3 ${fieldIdle}`}
          >
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full bg-transparent pt-3 text-sm font-medium text-[#101114] outline-none placeholder:text-transparent"
              required
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-5 text-[#686B82] transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:leading-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:leading-4">
              {t("email")}
            </span>
          </label>
          {error ? (
            <p className="text-sm text-[rgb(209,29,69)]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !isLoaded}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#101114] text-base font-medium text-white hover:bg-[#2A2A2A] disabled:opacity-60"
          >
            {t("sendEmail")}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onReset} noValidate>
          {info ? <p className="text-sm text-[#686B82]">{info}</p> : null}
          <div className="flex flex-col gap-0.5">
            <label
              className={`box-border flex h-[52px] flex-col justify-center overflow-clip rounded-t-[12px] rounded-b-[4px] px-3 ${fieldIdle}`}
            >
              <span className="text-xs leading-4 text-[#686B82]">{t("resetCode")}</span>
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
            <label
              className={`box-border flex h-[52px] items-center gap-2 overflow-clip rounded-t-[4px] rounded-b-[12px] px-3 ${fieldIdle}`}
            >
              <span className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="text-xs leading-4 text-[#686B82]">{t("newPassword")}</span>
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#101114] text-base font-medium text-white hover:bg-[#2A2A2A] disabled:opacity-60"
          >
            {t("resetPassword")}
          </button>
          <button
            type="button"
            className="text-sm font-medium text-[#686B82] hover:text-[#101114]"
            onClick={() => {
              setStep("request");
              setCode("");
              setPassword("");
              setError(null);
              setInfo(null);
            }}
          >
            {t("useDifferentEmail")}
          </button>
        </form>
      )}
    </div>
  );
}
