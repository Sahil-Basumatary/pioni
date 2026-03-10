import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import "./App.css";
import SentimentPage from "./pages/SentimentPage";
import TradingPage from "./pages/TradingPage";

const NAV_LINKS = [
  { to: "/trading", label: "Trading" },
  { to: "/sentiment", label: "Sentiment" },
] as const;

function App() {
  return (
    <BrowserRouter>
      <div
        className="min-h-screen w-full"
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        <nav className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-lg">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-12 flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center">
              <img src="/logo.svg" alt="Pioni" className="h-16 -my-2" />
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
            </div>
          </div>
        </nav>
        <main className="mx-auto w-full max-w-[1320px] px-6 lg:px-12 py-8">
          <Routes>
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="*" element={<Navigate to="/trading" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
