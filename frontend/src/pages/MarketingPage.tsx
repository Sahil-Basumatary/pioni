import { useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import MarketingAppShowcase from "../features/marketing/MarketingAppShowcase";
import MarketingClosing from "../features/marketing/MarketingClosing";
import MarketingDeskGallery from "../features/marketing/MarketingDeskGallery";
import MarketingFaq from "../features/marketing/MarketingFaq";
import MarketingFooter from "../features/marketing/MarketingFooter";
import MarketingHeader from "../features/marketing/MarketingHeader";
import MarketingHero from "../features/marketing/MarketingHero";
import MarketingIntegrityStrip from "../features/marketing/MarketingIntegrityStrip";
import MarketingLiveMarkets from "../features/marketing/MarketingLiveMarkets";
import MarketingPracticePanel from "../features/marketing/MarketingPracticePanel";
import MarketingSubNav from "../features/marketing/MarketingSubNav";
import { useMarketingHeroMotion } from "../features/marketing/useMarketingHeroMotion";
import { startPagePath } from "../features/settings/displayPrefs";
import "./marketingPage.css";

export default function MarketingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  // The tree below only mounts once Clerk resolves, so the motion effect has to
  // wait for it rather than firing against a null ref it can never re-check.
  useMarketingHeroMotion(rootRef, isLoaded && !isSignedIn);

  if (!isLoaded) {
    return <div className="min-h-dvh bg-[var(--mkt-ink-950,#0b0d11)]" aria-label="Loading" />;
  }
  if (isSignedIn) {
    return <Navigate to={startPagePath()} replace />;
  }

  return (
    <div ref={rootRef} className="marketing-page min-h-dvh text-[var(--text-primary)]">
      <MarketingHeader />
      <MarketingSubNav />
      <main>
        <MarketingHero />
        <MarketingLiveMarkets />
        <MarketingIntegrityStrip />
        <div className="marketing-plane-slot marketing-plane-slot--practice">
          <MarketingPracticePanel />
        </div>
        <div className="marketing-plane-slot marketing-plane-slot--desk">
          <MarketingDeskGallery />
        </div>
        <MarketingAppShowcase />
        <MarketingFaq />
        <MarketingClosing />
      </main>
      <MarketingFooter />
    </div>
  );
}
