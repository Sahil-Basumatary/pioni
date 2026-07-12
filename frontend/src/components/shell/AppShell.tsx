import type { ReactNode } from "react";
import { MarketSocketProvider } from "../../features/market/MarketSocketProvider";
import ProductNav from "./ProductNav";
import RightRail from "./RightRail";
import StatusBar from "./StatusBar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <MarketSocketProvider>
      <div
        className="flex h-dvh w-full flex-col overflow-hidden"
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        <div className="sticky top-0 z-50 shrink-0">
          <TopBar />
          <ProductNav />
        </div>
        <div className="flex min-h-0 flex-1">
          <main className="mx-auto flex min-h-0 w-full max-w-[1750px] flex-1 flex-col overflow-y-auto px-2 py-2">
            {children}
          </main>
          <RightRail />
        </div>
        <StatusBar />
      </div>
    </MarketSocketProvider>
  );
}
