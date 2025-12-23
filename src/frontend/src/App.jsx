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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001";

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
  const [tickerError, setTickerError] = useState(""); 
  const [requestError, setRequestError] = useState("");
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTickerChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/\s+/g, "");     
    value = value.replace(/[^A-Z]/g, "");  

    const devBypass = ["NONEWS", "NORED", "TOOFEW", "ZEROSENT", "LIMIT"];

    if (!devBypass.includes(value) && value.length > 5) {
      setTickerError("Tickers must be 1-5 letters (A-Z).");
      value = value.slice(0, 5);
    } else {
      setTickerError("");
    }

    setRequestError("");   
    setTicker(value);
  };

  const isTickerValid = (val) => {
  // for development testing purposes
    const devBypass = ["NONEWS", "TOOFEW", "ZEROSENT", "LIMIT", "NORED"];

    if (devBypass.includes(val)) return true;

    return /^[A-Z]{1,5}$/.test(val);
  };

  const fetchSentiment = async () => {
    if (!isTickerValid(ticker)) {
      setTickerError("Ticker looks invalid. Use 1-5 letters (A-Z).");
      return;
    }

    setLoading(true);
    setTickerError("");
    setRequestError("");
    setSentiment(null);
    setHistory([]);
    setChartLoading(false);
    setFeed([]);
    setFeedLoading(false);

    try {
      const start = Date.now();

      const response = await fetch(`${API_BASE_URL}/sentiment/${ticker}`)

      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {}

        const errorCode = payload?.error || payload?.detail?.error || null;

        if (errorCode === "INVALID_TICKER" || errorCode === "NO_DATA") {
          setRequestError("NOT_FOUND");
        } else if (errorCode === "NO_NEWS") {
          setRequestError("NO_NEWS");
        } else if (errorCode === "NO_REDDIT") {
          setRequestError("NO_REDDIT");
        } else if (errorCode === "ZERO_SENTIMENT") {
          setRequestError("ZERO_SENTIMENT");
        } else if (errorCode === "TOO_FEW_POSTS") {
          setRequestError("TOO_FEW_POSTS");
        } else if (errorCode === "RATE_LIMIT" || response.status === 429) {
          setRequestError("RATE_LIMIT");
        } else if (response.status >= 500) {
          setRequestError("SERVER_DOWN");
        } else {
          setRequestError("GENERIC");
        }

        return;
      }

      const data = await response.json();

      setFeedLoading(true);
      try {
        const feedResponse = await fetch(`${API_BASE_URL}/sentiment/feed/${ticker}`)

        if (feedResponse.ok) {
          const feedJson = await feedResponse.json();
          setFeed(feedJson.items ?? []);
        } else {
          setFeed([]);
        }
      } catch {
        setFeed([]);
      } finally {
        setFeedLoading(false);
      }

      setChartLoading(true);
      try {
        const historyResponse = await fetch(`${API_BASE_URL}/sentiment/history/${ticker}`)

        if (historyResponse.ok) {
          const hist = await historyResponse.json();
          setHistory(hist.history ?? []);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      } finally {
        setChartLoading(false);
      }

      const elapsed = Date.now() - start;
      const MIN_LOAD = 600;
      if (elapsed < MIN_LOAD) await wait(MIN_LOAD - elapsed);

      setSentiment(data);

    } catch (err) {
      setRequestError("SERVER_OFFLINE");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLabel = (value) => {
    if (value < 0.33) return "Low confidence";
    if (value < 0.66) return "Medium confidence";
    return "High confidence";
  };

  const getSentimentLabel = (value) => {
    if (value > 0.6) return "Positive";
    if (value < 0.4) return "Negative";
    return "Neutral";
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
            borderColor: "#2A2A2A", 
            pointBackgroundColor: "#2A2A2A",
          },
        ],
      }
    : null;

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

                  {tickerError && (
                    <p className="mt-2 text-[10px] text-red-500 font-medium">
                      {tickerError}
                    </p>
                  )}

                  <button
                    onClick={fetchSentiment}
                    disabled={loading || ticker.length === 0}
                    className="btn-premium w-full mt-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "hold on, cooking..." : "Get sentiment"}
                  </button>

                  {requestError === "NOT_FOUND" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Ticker not found"
                      body="We couldn't locate this symbol in our data sources."
                    />
                  )}

                  {requestError === "RATE_LIMIT" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Too many requests"
                      body="We're hitting the sentiment API too often. Please wait a bit and try again."
                    />
                  )}

                  {requestError === "SERVER_DOWN" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Service problem"
                      body="The sentiment service is temporarily unavailable. Please try again soon."
                    />
                  )}

                  {requestError === "SERVER_OFFLINE" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Backend is offline"
                      body="Can't reach the sentiment server. Make sure your FastAPI backend is running."
                    />
                  )}

                  {requestError === "GENERIC" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Something went wrong"
                      body="Please try again in a moment."
                    />
                  )}

                  {requestError === "NO_NEWS" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="No news found"
                      body="We couldn't find any recent news articles for this ticker."
                    />
                  )}

                  {requestError === "NO_REDDIT" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="No Reddit mentions"
                      body="No recent Reddit posts matched this ticker."
                    />
                  )}

                  {requestError === "ZERO_SENTIMENT" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Perfectly neutral sentiment"
                      body="Recent posts balance out to exactly neutral, so there's no clear lean yet."
                    />
                  )}

                  {requestError === "TOO_FEW_POSTS" && (
                    <EmptyStatePanel
                      variant="warning"
                      title="Too little data"
                      body="There aren't enough recent posts yet to calculate a meaningful sentiment score."
                    />
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
                      {sentiment?.ticker}
                    </p>
                    <p className="text-4xl font-semibold mt-1 leading-tight">
                      {(sentiment?.sentiment ?? 0).toFixed(2)}
                    </p>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--card-border)]">
                    {getSentimentLabel(sentiment?.sentiment ?? 0)}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Combined mood from recent news and Reddit sources.
                </p>

                {/* Confidence */}
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-[var(--text-muted)]">Confidence</p>

                    <p className="text-[10px] font-medium text-[var(--text-primary)] tabular-nums">
                      {Math.round((sentiment?.confidence ?? 0) * 100)}%
                    </p>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-[#E5E5E5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{
                        width: `${Math.round((sentiment?.confidence ?? 0) * 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-[10px] font-medium text-[var(--text-secondary)]">
                    {getConfidenceLabel(sentiment?.confidence ?? 0)}
                  </p>
                </div>

                {/* Sources */}
                {sentiment?.sources && (
                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">
                      Breakdown by source
                    </p>

                    {Object.entries(sentiment.sources).map(([source, value]) => (
                      <div key={source} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">
                          {source === "newsapi"
                            ? "News"
                            : source === "reddit"
                            ? "Reddit"
                            : source}
                        </span>

                        <span className="font-medium tabular-nums">
                          {(value ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
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


    {/* Feed panel (full-width under both columns) */}
    {(sentiment || feedLoading) && (
      <div className="card-premium rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Recent mentions
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              News headlines and posts that shape this sentiment score.
            </p>
          </div>
        </div>

        {feedLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="h-8 w-8 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 skeleton" />
                  <div className="h-3 w-1/2 skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!feedLoading && feed && feed.length > 0 && (
          <div className="space-y-2">
            {feed.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2 border-t border-[var(--card-border)] first:border-t-0"
              >
                <div className="mt-1 text-[10px] px-2 py-1 rounded-full bg-[var(--bg)] border border-[var(--card-border)]">
                  {item.type === "news" ? "News" : "Reddit"}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                    {item.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    {item.source && <span>{item.source}</span>}
                    {item.ago && (
                      <>
                        <span>•</span>
                        <span>{item.ago}</span>
                      </>
                    )}
                    {typeof item.score === "number" && (
                      <>
                        <span>•</span>
                        <span
                          className={
                            item.score > 0.1
                              ? "text-emerald-600"
                              : item.score < -0.1
                              ? "text-red-500"
                              : "text-[var(--text-muted)]"
                          }
                        >
                          {item.score.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!feedLoading && sentiment && feed && feed.length === 0 && (
          <EmptyStatePanel
            variant="history"
            title="No posts to show yet"
            body="We couldn't pull any recent headlines or Reddit posts for this ticker in mock mode."
          />
        )}
      </div>
    )}
    </div>
  );
}
export default App;