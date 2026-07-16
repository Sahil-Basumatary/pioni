import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MarketSocketProvider } from "../../features/market/MarketSocketProvider";
import {
  MarketSearchProvider,
} from "../../features/markets/MarketSearchContext";
import MarketSearchPalette from "../../features/markets/MarketSearchPalette";
import ProductNav from "./ProductNav";
import RightRail from "./RightRail";
import StatusBar from "./StatusBar";
import TopBar from "./TopBar";

function isWorkspaceRoute(pathname: string): boolean {
  return pathname === "/trading" || pathname.startsWith("/trade/");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const workspace = isWorkspaceRoute(pathname);

  return (
    <MarketSocketProvider>
      <MarketSearchProvider>
        <div
          className="flex h-dvh w-full flex-col overflow-hidden"
          style={{ background: "var(--bg)", color: "var(--text-primary)" }}
        >
          <div className="sticky top-0 z-50 shrink-0">
            <TopBar />
            <ProductNav />
          </div>
          <div className="flex min-h-0 flex-1">
            <main
              className={`mx-auto flex min-h-0 w-full max-w-[1750px] flex-1 flex-col px-2 py-2 ${
                workspace ? "overflow-hidden" : "overflow-y-auto"
              }`}
            >
              {children}
            </main>
            <RightRail />
          </div>
          <StatusBar />
          <MarketSearchPalette />
        </div>
      </MarketSearchProvider>
    </MarketSocketProvider>
  );
}
