import { useState } from "react";
import "./loader.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import "./App.css";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

function EmptyStatePanel({ variant, title, body }) {
  const renderIcon = () => {
    if (variant === "search") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
      );
    }

    if (variant === "history") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="12" y2="17" />
        </svg>
      );
    }

    if (variant === "warning") {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-600"
        >
          <path d="M10.29 3.86L1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{renderIcon()}</div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </p>
          {body && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTickerChange = (e) => {
    let value = e.target.value.toUpperCase();

    value = value.replace(/\s+/g, "");

    value = value.replace(/[^A-Z0-9.\-]/g, "");

    if (value.length > 5) {
      setError("Tickers must be 1-5 characters.");
      value = value.slice(0, 5);
    } else {
      setError("");
    }

    setTicker(value);
  };
  
  const fetchSentiment = async () => {
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setSentiment(null);

    try {
      const start = Date.now();

      const response = await fetch(`http://127.0.0.1:8000/sentiment/${ticker}`);
      if (!response.ok) throw new Error("Failed to fetch sentiment data");

      setChartLoading(true);
      const historyData = await fetchHistory(ticker);
      setHistory(historyData.history);
      setChartLoading(false);

      const data = await response.json();

      // --- enforce minimum loading time ---
      const elapsed = Date.now() - start;
      const MIN_LOAD = 600; // ms (premium-feel)
      if (elapsed < MIN_LOAD) await wait(MIN_LOAD - elapsed);

      setSentiment(data);
    } catch (err) {
      setError("OOPS! Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = (score) => {
    if (score > 0.25) return "Leaning positive :)";
    if (score < -0.25) return "Leaning negative :(";
    return "Mixed or neutral";
  };

  const getConfidenceLabel = (value) => {
    if (value < 0.33) return "Low confidence";
    if (value < 0.66) return "Medium confidence";
    return "High confidence";
  };

  const historyChartData = history.length
    ? {
        labels: history.map((i) => i.date),
        datasets: [
          {
            label: "7-Day Sentiment Trend",
            data: history.map((i) => i.score),
            borderWidth: 2,
            tension: 0.25,
            borderColor: "#2A2A2A", // BlackRock graphite
            pointBackgroundColor: "#2A2A2A",
          },
        ],
      }
    : null;

  const fetchHistory = async (ticker) => {
    const response = await fetch(`http://127.0.0.1:8000/sentiment/history/${ticker}`);
    if (!response.ok) throw new Error("Failed to fetch history");
    return await response.json();
  };

  /* main UI */

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-10"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="w-full max-w-5xl space-y-10">
        {/* Header */}
        <header className="header-premium flex items-center justify-between pb-5 mb-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Pioni Sentiment</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Quick read on how the market is feeling about a ticker.
            </p>
          </div>
          <div className="hidden md:flex items-center text-xs px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]">
            <span className="mr-1 h-2 w-2 rounded-full bg-emerald-400"></span>
            Mock mode on
          </div>
        </header>

        {/* Main grid */}
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          {/* Left column: input + sentiment */}
          <div className="space-y-5">

            {/* INPUT CARD */}
            <div className="card-premium rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-5">
              {!loading ? (
                <>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Ticker
                  </label>

                  <input
                    type="text"
                    placeholder="Example: TSLA"
                    value={ticker}
                    onChange={handleTickerChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#EDEDED] 
                              border border-[var(--card-border)] 
                              text-[var(--text-primary)] text-sm 
                              focus:ring-2 focus:ring-[var(--accent)]"
                  />

                  {error && (
                    <p className="mt-2 text-[10px] text-red-500 font-medium">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={fetchSentiment}
                    disabled={loading}
                    className="btn-premium w-full mt-4 text-sm"
                  >
                    {loading ? "hold on, cooking..." : "Get sentiment"}
                  </button>

                  {error && (
                    <div className="mt-3 text-xs rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-600">
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 skeleton"></div>
                  <div className="h-10 skeleton"></div>
                </div>
              )}
            </div>

            {loading && (
              <div className="card-premium mt-3 w-full max-w-md rounded-xl p-5 border border-[var(--card-border)] space-y-4">
                <div className="h-4 w-20 skeleton"></div>   {/* Ticker label */}
                <div className="h-8 w-32 skeleton"></div>   {/* Big number */}
                <div className="h-3 w-full skeleton"></div> {/* Description line */}
                <div className="h-3 w-4/5 skeleton"></div> {/* Description line */}
                <div className="h-2 w-full skeleton mt-3"></div> {/* Confidence bar */}
              </div>
            )}

            {sentiment && (
              <div className="card-premium mt-3 w-full max-w-md rounded-xl p-5 border border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      {sentiment.ticker}
                    </p>
                    <p className="text-4xl font-semibold mt-1 leading-tight">
                      {sentiment.sentiment.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--card-border)]">
                    {getSentimentLabel(sentiment.sentiment)}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Combined mood from recent news and Reddit sources.
                </p>

                <div className="pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Confidence
                    </p>

                    {/* Numeric percentage */}
                    <p className="text-[10px] font-medium text-[var(--text-primary)] tabular-nums">
                      {Math.round((sentiment.confidence ?? 0) * 100)}%
                    </p>
                  </div>

                  {/* Confidence bar */}
                  <div className="h-1.5 w-full rounded-full bg-[#E5E5E5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{
                        width: `${Math.round((sentiment.confidence ?? 0) * 100)}%`,
                      }}
                    />
                    <p className="mt-2 text-[10px] font-medium text-[var(--text-secondary)]">
                      {getConfidenceLabel(sentiment.confidence)}
                    </p>
                  </div>
                </div>

                {sentiment.sources && (
                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">
                      Breakdown by source
                    </p>
                    <div className="space-y-1">
                      {Object.entries(sentiment.sources).map(([source, value]) => (
                        <div
                          key={source}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[var(--text-muted)]">
                            {source === "newsapi"
                              ? "News"
                              : source === "reddit"
                              ? "Reddit"
                              : source}
                          </span>
                          <span className="font-medium tabular-nums">
                            {value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )} 
              </div>
            )}
          </div>

          {/* Right column: chart */}
          <div className="flex flex-col h-full">
            <div className="card-premium chart-card flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-2xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  7-day sentiment trend
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Simple rolling view based on the latest checks.
                </p>
              </div>

              {chartLoading && (
                <div className="w-full h-64 relative overflow-hidden rounded-xl bg-[var(--card-bg)] skeleton-chart">
                  {/* light grid */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.15]">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border border-black/5"></div>
                    ))}
                  </div>

                  {/* hint of a line */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-30"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="0,25 20,10 40,30 60,15 80,28 100,12"
                    />
                  </svg>

                  {/* shimmer */}
                  <div className="absolute inset-0 shimmer" />
                </div>
              )}

              {!chartLoading && historyChartData && (
                <Line
                  data={historyChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    animation: {
                      duration: 450,
                      easing: "easeOutQuad",
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(0,0,0,0.05)" },
                        ticks: { color: "var(--text-muted)", font: { size: 10 } },
                      },
                      y: {
                        grid: { color: "rgba(0,0,0,0.05)" },
                        ticks: { color: "var(--text-muted)", font: { size: 10 } },
                      },
                    },
                  }}
                />
              )}

              {!chartLoading && !historyChartData && sentiment && (
                <div className="w-full h-56 flex items-center justify-center">
                  <EmptyStatePanel
                    variant="history"
                    title="No history for this ticker"
                    body="The mock backend only returns a short window for some tickers while building."
                  />
                </div>
              )}

              {!chartLoading && !sentiment && (
                <div className="w-full h-56 flex items-center justify-center">
                  <EmptyStatePanel
                    variant="search"
                    title="No ticker selected"
                    body="Enter a stock symbol on the left to see its recent sentiment trend."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;