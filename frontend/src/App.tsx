import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import AppShell from "./components/shell/AppShell";
import ComingSoonPage from "./pages/ComingSoonPage";
import { LanguageProvider } from "./features/auth/LanguageProvider";
import { startPagePath } from "./features/settings/displayPrefs";
import "./App.css";

const SentimentPage = lazy(() => import("./pages/SentimentPage"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const MarketsPage = lazy(() => import("./pages/MarketsPage"));
const PropPage = lazy(() => import("./pages/PropPage"));
const EarnPage = lazy(() => import("./pages/EarnPage"));
const ConvertPage = lazy(() => import("./pages/ConvertPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const OtcPage = lazy(() => import("./pages/OtcPage"));
const OtcPortalPage = lazy(() => import("./pages/OtcPortalPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SsoCallbackPage = lazy(() => import("./pages/SsoCallbackPage"));

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

function StartRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  const path = startPagePath();
  if (!isSignedIn && path === "/home") {
    return <Navigate to="/trading" replace />;
  }
  return <Navigate to={path} replace />;
}

function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-dvh bg-[#F6F5F9]" aria-label="Loading" />}>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/sso-callback" element={<SsoCallbackPage />} />
          <Route element={<ShellLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/trade/margin" element={<TradingPage venue="margin" />} />
            <Route path="/trade/futures" element={<TradingPage venue="futures" />} />
            <Route path="/trade/prop" element={<PropPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/yield" element={<EarnPage />} />
            <Route path="/earn" element={<EarnPage />} />
            <Route
              path="/deposit"
              element={
                <ComingSoonPage
                  title="Deposit"
                  description="Paper deposits will reset or top up practice balance without touching real money."
                />
              }
            />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/analytics" element={<Navigate to="/analytics/btcusdt" replace />} />
            <Route path="/analytics/:pair" element={<AnalyticsPage />} />
            <Route path="/otc" element={<OtcPage />} />
            <Route path="/otc/quote" element={<OtcPortalPage />} />
            <Route path="/otc/portal" element={<OtcPortalPage />} />
            <Route path="/otc/dashboard" element={<OtcPortalPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<StartRedirect />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
