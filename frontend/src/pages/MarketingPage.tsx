import { useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import MarketingBoard from "../features/marketing/MarketingBoard";
import MarketingFooter from "../features/marketing/MarketingFooter";
import MarketingHeader from "../features/marketing/MarketingHeader";
import MarketingHero from "../features/marketing/MarketingHero";
import MarketingHowItWorks from "../features/marketing/MarketingHowItWorks";
import MarketingProof from "../features/marketing/MarketingProof";
import MarketingTrust from "../features/marketing/MarketingTrust";
import { useMarketingHeroMotion } from "../features/marketing/useMarketingHeroMotion";
import { startPagePath } from "../features/settings/displayPrefs";
import "./marketingPage.css";

export default function MarketingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  useMarketingHeroMotion(rootRef);

  if (!isLoaded) {
    return <div className="min-h-dvh bg-[#F6F5F9]" aria-label="Loading" />;
  }
  if (isSignedIn) {
    return <Navigate to={startPagePath()} replace />;
  }

  return (
    <div ref={rootRef} className="marketing-page min-h-dvh text-[var(--text-primary)]">
      <MarketingHeader />
      <main>
        <MarketingHero />
        <MarketingBoard />
        <MarketingHowItWorks />
        <MarketingProof />
        <MarketingTrust />
      </main>
      <MarketingFooter />
    </div>
  );
}
