import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { isClerkAPIResponseError } from "@clerk/clerk-react/errors";
import { EyeIcon, EyeOffIcon } from "../../components/shell/shellIcons";
import { SIGN_UP_PATH } from "./authRoutes";

const SSO_CALLBACK = "/sso-callback";
const fieldIdle =
  "bg-[rgba(104,107,130,0.04)] hover:bg-[rgba(104,107,130,0.08)] focus-within:bg-[rgba(104,107,130,0.08)] focus-within:outline focus-within:outline-2 focus-within:outline-[#101114] focus-within:outline-offset-0";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
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
        setError("Additional verification is required for this account");
        return;
      }
      setError("Couldn’t complete sign in. Try again");
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

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] bg-white px-6 py-6 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.svg" alt="" className="h-14 w-auto" />
        <h1 className="text-center text-[28px] font-medium leading-9 tracking-tight text-[#101114]">
          Sign in to Pioni
        </h1>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-0.5">
          <label
            className={`box-border flex h-[52px] flex-col justify-center overflow-clip rounded-t-[12px] rounded-b-[4px] px-3 ${fieldIdle}`}
          >
            <span className="text-xs leading-4 text-[#686B82]">Email or username</span>
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
              <span className="text-xs leading-4 text-[#686B82]">Password</span>
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          Forgot{" "}
          <button
            type="button"
            className="font-medium text-[#101114] underline-offset-2 hover:underline"
            onClick={() =>
              setError(
                "Password reset isn’t available in this paper build yet. Use Google or X, or Sign up",
              )
            }
          >
            password
          </button>{" "}
          or{" "}
          <button
            type="button"
            className="font-medium text-[#101114] underline-offset-2 hover:underline"
            onClick={() =>
              setError("Enter the email on your account. Usernames match your profile")
            }
          >
            username
          </button>
          ?
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
          Continue
        </button>
      </form>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(104,107,130,0.16)]" />
        <span className="text-sm text-[#686B82]">Or</span>
        <div className="h-px flex-1 bg-[rgba(104,107,130,0.16)]" />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !isLoaded}
          onClick={() => void onOAuth("oauth_google")}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] text-base font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)] disabled:opacity-60"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          disabled={busy || !isLoaded}
          onClick={() => void onOAuth("oauth_x")}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[rgba(104,107,130,0.08)] text-base font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)] disabled:opacity-60"
        >
          Sign in with X
        </button>
      </div>
      <p className="text-center text-sm text-[#686B82]">
        Don&apos;t have an account?{" "}
        <Link
          to={SIGN_UP_PATH}
          className="font-medium text-[#101114] underline-offset-2 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export function clerkErrorMessage(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage || err.errors[0]?.message || "Sign in failed";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Sign in failed";
}
