import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MarketSocketProvider } from "../../features/market/MarketSocketProvider";
import {
  MarketSearchProvider,
} from "../../features/markets/MarketSearchContext";
import MarketSearchPalette from "../../features/markets/MarketSearchPalette";
import { ConvertProvider } from "../../features/convert/ConvertContext";
import ConvertDialog from "../../features/convert/ConvertDialog";
import { SettingsProvider } from "../../features/settings/settingsContext";
import SettingsDialog from "../../features/settings/SettingsDialog";
import ToastHost from "../../features/toasts/ToastHost";
import OrderStatusSocketProvider from "../../features/toasts/OrderStatusSocketProvider";
import { TourProvider } from "../../features/onboarding/TourProvider";
import WelcomeCard from "../../features/onboarding/WelcomeCard";
import FirstTradeCelebration from "../../features/onboarding/FirstTradeCelebration";
import { ChecklistProvider } from "../../features/onboarding/ChecklistContext";
import GettingStartedChecklist from "../../features/onboarding/GettingStartedChecklist";
import { AlertCreateProvider } from "../../features/trading/AlertCreateContext";
import CreateAlertDialog from "../../features/trading/CreateAlertDialog";
import PriceAlertWatcher from "../../features/trading/PriceAlertWatcher";
import { useCompactShell } from "../../hooks/useCompactShell";
import GetAppBanner from "./GetAppBanner";
import ProductNav from "./ProductNav";
import RightRail from "./RightRail";
import StatusBar from "./StatusBar";
import TopBar from "./TopBar";

function isWorkspaceRoute(pathname: string): boolean {
  return (
    pathname === "/trading" ||
    pathname === "/trade/margin" ||
    pathname === "/trade/futures"
  );
}

function LastPathTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (
      pathname.startsWith("/settings") ||
      pathname === "/" ||
      pathname.includes(".")
    ) {
      return;
    }
    try {
      sessionStorage.setItem("pioni.lastPath", pathname);
    } catch {
      /* ignore */
    }
  }, [pathname]);
  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const workspace = isWorkspaceRoute(pathname);
  const compact = useCompactShell();

  return (
    <MarketSocketProvider>
      <MarketSearchProvider>
        <ConvertProvider>
          <AlertCreateProvider>
          <SettingsProvider>
            <OrderStatusSocketProvider>
              <TourProvider>
                <ChecklistProvider>
                <div
                  className="flex h-dvh w-full flex-col overflow-hidden"
                  style={{ background: "var(--bg)", color: "var(--text-primary)" }}
                >
                  <div className="sticky top-0 z-50 shrink-0">
                    {compact && <GetAppBanner />}
                    <TopBar compact={compact} />
                    {!compact && <ProductNav />}
                  </div>
                  <div className="flex min-h-0 flex-1">
                    <main
                      className={`mx-auto flex min-h-0 w-full max-w-[1750px] flex-1 flex-col ${
                        compact && workspace ? "px-0 py-0" : "px-2 py-2"
                      } ${workspace ? "overflow-hidden" : "overflow-y-auto"}`}
                    >
                      {children}
                    </main>
                    {!compact && <RightRail />}
                  </div>
                  <StatusBar />
                  <LastPathTracker />
                  <MarketSearchPalette />
                  <ConvertDialog />
                  <CreateAlertDialog />
                  <PriceAlertWatcher />
                  <SettingsDialog />
                  <WelcomeCard />
                  <FirstTradeCelebration />
                  <GettingStartedChecklist />
                  <ToastHost />
                </div>
                </ChecklistProvider>
              </TourProvider>
            </OrderStatusSocketProvider>
          </SettingsProvider>
          </AlertCreateProvider>
        </ConvertProvider>
      </MarketSearchProvider>
    </MarketSocketProvider>
  );
}
