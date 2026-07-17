import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import ComingSoonPage from "./pages/ComingSoonPage";
import "./App.css";

const SentimentPage = lazy(() => import("./pages/SentimentPage"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const MarketsPage = lazy(() => import("./pages/MarketsPage"));
const PropPage = lazy(() => import("./pages/PropPage"));
const EarnPage = lazy(() => import("./pages/EarnPage"));
const ConvertPage = lazy(() => import("./pages/ConvertPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

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
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/trade/margin" element={<TradingPage venue="margin" />} />
            <Route path="/trade/futures" element={<TradingPage venue="futures" />} />
            <Route path="/trade/prop" element={<PropPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/yield" element={<EarnPage />} />
            <Route path="/earn" element={<EarnPage />} />
            <Route path="/deposit" element={
              <ComingSoonPage
                title="Deposit"
                description="Paper deposits will reset or top up practice balance without touching real money."
              />
            } />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
