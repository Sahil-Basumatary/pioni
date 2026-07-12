import type { ReactNode } from "react";
import Footer from "../Footer";
import ProductNav from "./ProductNav";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen w-full flex-col overflow-x-clip"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="sticky top-0 z-50">
        <TopBar />
        <ProductNav />
      </div>
      <main className="mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col px-6 py-6 lg:px-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
