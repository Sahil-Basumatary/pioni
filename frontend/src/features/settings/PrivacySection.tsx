import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { LEGAL } from "../../pages/legal/legalConfig";
import { useGetMyOnboardingQuery } from "../onboarding/onboardingApi";
import {
  useLazyGetMyPortfolioQuery,
  useLazyGetMyPositionsQuery,
  useLazyGetMySummaryQuery,
  useLazyGetMyTradesQuery,
} from "../portfolio/portfolioApi";
import { useToast } from "../toasts/useToast";
import { useGetMyApiKeysQuery } from "./apiKeysApi";
import { readDisplayPrefs } from "./displayPrefs";
import { readNotificationPrefs } from "./notificationPrefs";
import { buildPrivacyExport, downloadPrivacyExport } from "./privacyExport";
import { readRegionalPrefs } from "./regionalPrefs";
import { useSettings } from "./settingsContext";
import { SIGN_IN_PATH } from "../auth/authRoutes";

export default function PrivacySection() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const { setSection, closeSettings } = useSettings();
  const [exporting, setExporting] = useState(false);
  const { data: onboarding } = useGetMyOnboardingQuery(undefined, {
    skip: !isSignedIn,
  });
  const { data: apiKeys = [] } = useGetMyApiKeysQuery(undefined, {
    skip: !isSignedIn,
  });
  const [fetchPortfolio] = useLazyGetMyPortfolioQuery();
  const [fetchSummary] = useLazyGetMySummaryQuery();
  const [fetchPositions] = useLazyGetMyPositionsQuery();
  const [fetchTrades] = useLazyGetMyTradesQuery();

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-[#787774]">
          Sign in to view privacy controls and export your data.
        </p>
        <button
          type="button"
          onClick={() => {
            closeSettings();
            navigate(SIGN_IN_PATH);
          }}
          className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function onExport() {
    setExporting(true);
    try {
      const [portfolio, summary, positions, trades] = await Promise.all([
        fetchPortfolio().unwrap(),
        fetchSummary().unwrap(),
        fetchPositions({ openOnly: false }).unwrap(),
        fetchTrades({ limit: 200 }).unwrap(),
      ]);
      const payload = buildPrivacyExport({
        account: {
          id: user?.id ?? "",
          username: user?.username ?? null,
          email:
            user?.primaryEmailAddress?.emailAddress ??
            user?.emailAddresses[0]?.emailAddress ??
            null,
          full_name: user?.fullName ?? null,
        },
        portfolio,
        summary,
        positions,
        trades,
        onboarding: onboarding ?? null,
        apiKeys,
        display: readDisplayPrefs(),
        regional: readRegionalPrefs(),
        notifications: readNotificationPrefs(),
      });
      downloadPrivacyExport(payload);
      toast("Data export downloaded");
    } catch {
      toast("Couldn’t export data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-base font-semibold text-[#2C2C2B]">Privacy policy</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Read how Pioni collects and uses account and paper-trading data.
        </p>
        <Link
          to="/privacy"
          onClick={closeSettings}
          className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
        >
          Open privacy policy
        </Link>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">What we store</h3>
        <dl className="mt-4 divide-y divide-[rgba(42,28,0,0.07)]">
          <div className="flex flex-col gap-1 py-3.5 first:pt-0 sm:flex-row sm:gap-10">
            <dt className="w-36 shrink-0 text-sm font-semibold text-[#2C2C2B]">
              Account
            </dt>
            <dd className="min-w-0 text-sm leading-relaxed text-[#787774]">
              Sign-in identity from your auth provider, including name, email, and
              account ID.
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-10">
            <dt className="w-36 shrink-0 text-sm font-semibold text-[#2C2C2B]">
              Paper activity
            </dt>
            <dd className="min-w-0 text-sm leading-relaxed text-[#787774]">
              Simulated portfolio, orders, trades, positions, and onboarding
              progress.
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-10">
            <dt className="w-36 shrink-0 text-sm font-semibold text-[#2C2C2B]">
              Preferences
            </dt>
            <dd className="min-w-0 text-sm leading-relaxed text-[#787774]">
              Display, regional, and notification choices saved on this device.
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-10">
            <dt className="w-36 shrink-0 text-sm font-semibold text-[#2C2C2B]">
              Not collected
            </dt>
            <dd className="min-w-0 text-sm leading-relaxed text-[#787774]">
              Payment cards, bank details, and government identity documents.
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Export your data</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Download a JSON file with your account profile, paper portfolio, trades,
          positions, API key metadata, and local preferences.
        </p>
        <button
          type="button"
          disabled={exporting}
          onClick={() => void onExport()}
          className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)] disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download data export"}
        </button>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Privacy requests</h3>
        <p className="mt-1 text-sm text-[#787774]">
          For access, correction, or deletion requests beyond in-app controls,
          contact {LEGAL.contactEmail}.
        </p>
        <a
          href={`mailto:${LEGAL.contactEmail}`}
          className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
        >
          Email privacy contact
        </a>
      </section>

      <section className="border-t border-[rgba(42,28,0,0.07)] pt-6">
        <h3 className="text-base font-semibold text-[#2C2C2B]">Delete account</h3>
        <p className="mt-1 text-sm text-[#787774]">
          Permanently delete your account from Account settings.
        </p>
        <button
          type="button"
          onClick={() => setSection("account")}
          className="mt-3 inline-flex h-7 items-center rounded-[6px] border border-[rgba(28,19,1,0.11)] px-2 text-sm font-medium text-[#2C2C2B] hover:bg-[rgba(42,28,0,0.045)]"
        >
          Go to Account
        </button>
      </section>
    </div>
  );
}
