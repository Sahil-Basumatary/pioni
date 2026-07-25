import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import OtcPortalShell from "../features/otc/OtcPortalShell";
import OtcRfqPanel from "../features/otc/OtcRfqPanel";
import OtcDashboardPanel from "../features/otc/OtcDashboardPanel";
import { isOtcUnlocked, setOtcUnlocked } from "../features/otc/otcPortalContent";
import { SIGN_IN_PATH } from "../features/auth/authRoutes";

export default function OtcPortalPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => isOtcUnlocked());

  useEffect(() => {
    setUnlocked(isOtcUnlocked());
  }, [location.pathname]);

  if (!isLoaded) {
    return (
      <div className="px-2 py-10 text-sm text-[var(--text-muted)]">Loading…</div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-medium">Paper OTC Portal</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Sign in to unlock the simulated OTC Portal (RFQ, exposure and history).
        </p>
        <button
          type="button"
          onClick={() => navigate(SIGN_IN_PATH)}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => navigate("/otc")}
          className="text-sm text-[var(--text-muted)] underline"
        >
          Back to OTC overview
        </button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-medium">Unlock paper OTC</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Confirm to open the paper OTC Portal. Quotes and fills are simulated only.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOtcUnlocked(true);
              setUnlocked(true);
            }}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white"
          >
            Unlock OTC Portal
          </button>
          <button
            type="button"
            onClick={() => navigate("/otc")}
            className="inline-flex h-10 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-4 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isDashboard = location.pathname.includes("/dashboard");

  return (
    <OtcPortalShell>
      {isDashboard ? <OtcDashboardPanel /> : <OtcRfqPanel />}
    </OtcPortalShell>
  );
}
