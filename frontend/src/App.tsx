import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Footer from "./components/Footer";
import "./App.css";

const SentimentPage = lazy(() => import("./pages/SentimentPage"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

const NAV_LINKS = [
  { to: "/trading", label: "Trading" },
  { to: "/sentiment", label: "Sentiment" },
] as const;

function RouteFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-label="Loading page">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE"].map((symbol) => (
              <div
                key={symbol}
                className="h-9 w-24 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/80"
              />
            ))}
          </div>
          <div className="h-4 w-20 rounded-full bg-[var(--card-bg)]/80" />
        </div>
        <div className="h-[74px] rounded-2xl border border-transparent" />
      </div>
      <div className="card-premium flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div
        className="flex min-h-screen w-full flex-col overflow-x-clip"
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        <nav className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-lg">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-12 flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center">
              <img src="/logo.svg" alt="Pioni" className="h-9" />
            </NavLink>
            <div className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="ml-2 flex items-center">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col px-6 lg:px-12 py-8">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/sentiment" element={<SentimentPage />} />
              <Route path="/trading" element={<TradingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/trading" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
export default App;
