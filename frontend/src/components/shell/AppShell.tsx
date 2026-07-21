import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MarketSocketProvider } from "../../features/market/MarketSocketProvider";
import {
  MarketSearchProvider,
} from "../../features/markets/MarketSearchContext";
import MarketSearchPalette from "../../features/markets/MarketSearchPalette";
import { ConvertProvider } from "../../features/convert/ConvertContext";
import ConvertDialog from "../../features/convert/ConvertDialog";
import ToastHost from "../../features/toasts/ToastHost";
import OrderStatusSocketProvider from "../../features/toasts/OrderStatusSocketProvider";
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

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const workspace = isWorkspaceRoute(pathname);
  const compact = useCompactShell();
  const compactTrade = compact && workspace;

  return (
    <MarketSocketProvider>
      <MarketSearchProvider>
        <ConvertProvider>
          <OrderStatusSocketProvider>
            <div
              className="flex h-dvh w-full flex-col overflow-hidden"
              style={{ background: "var(--bg)", color: "var(--text-primary)" }}
            >
              <div className="sticky top-0 z-50 shrink-0">
                {compactTrade && <GetAppBanner />}
                <TopBar compact={compactTrade} />
                {!compactTrade && <ProductNav />}
              </div>
              <div className="flex min-h-0 flex-1">
                <main
                  className={`mx-auto flex min-h-0 w-full max-w-[1750px] flex-1 flex-col ${
                    compactTrade ? "px-0 py-0" : "px-2 py-2"
                  } ${workspace ? "overflow-hidden" : "overflow-y-auto"}`}
                >
                  {children}
                </main>
                {!compactTrade && <RightRail />}
              </div>
              <StatusBar />
              <MarketSearchPalette />
              <ConvertDialog />
              <ToastHost />
            </div>
          </OrderStatusSocketProvider>
        </ConvertProvider>
      </MarketSearchProvider>
    </MarketSocketProvider>
  );
}
