import { useState, lazy, Suspense } from "react";
import "./loader.css";
import "./App.css";
import { cacheLabel, formatSigned, formatAsOf, timeAgoFromIso, pct } from "./utils/formatters";
import { agreementLabel, dispersionLabel, deriveTrendStats, pickDrivers, getConfidenceLabel, getSentimentLabel } from "./utils/sentiment";
import Chip from "./components/Chip";
import EmptyStatePanel from "./components/EmptyStatePanel";
import ChartSkeleton from "./components/ChartSkeleton";
import TrendSummary from "./components/TrendSummary";
import TrendDrivers from "./components/TrendDrivers";
import TrendEmptyPreview from "./components/TrendEmptyPreview";
import FeedCard from "./components/FeedCard";

const SentimentChart = lazy(() => import("./components/SentimentChart"));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8003";

function App() {
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tickerError, setTickerError] = useState(""); 
  const [requestError, setRequestError] = useState("");
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [appMode, setAppMode] = useState(null);

  const [recentTickers, setRecentTickers] = useState(() => {
    try {
      const raw = localStorage.getItem("pioni_recent_tickers");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveRecentTickers = (next) => {
    setRecentTickers(next);
    try {
      localStorage.setItem("pioni_recent_tickers", JSON.stringify(next));
    } catch {
      return;
    }
  };

  const pushRecentTicker = (symbol) => {
    const clean = String(symbol || "").toUpperCase();
    if (!clean) return;

    const next = [clean, ...recentTickers.filter((t) => t !== clean)].slice(0, 6);
    saveRecentTickers(next);
  };

  const clearRecentTickers = () => {
    saveRecentTickers([]);
    try {
      localStorage.removeItem("pioni_recent_tickers");
    } catch {
      return;
    }
  };

  const QUICK_PICKS = ["TSLA", "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"];

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
    const devBypass = ["NONEWS", "TOOFEW", "ZEROSENT", "LIMIT", "NORED"];

    if (devBypass.includes(val)) return true;

    return /^[A-Z]{1,5}$/.test(val);
  };

  const fetchSentiment = async (symbolOverride) => {
    const symbol = (symbolOverride ?? ticker).toUpperCase();
    if (!isTickerValid(symbol)) {
      setTickerError("Ticker looks invalid. Use 1-5 letters (A-Z).");
      return;
    }

    setLoading(true);
    setTickerError("");
    setTicker(symbol);
    setRequestError("");
    setCacheStatus(null);
    setAppMode(null);
    setSentiment(null);
    setHistory([]);
    setChartLoading(false);
    setFeed([]);

    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/${symbol}`)
      const xCache = response.headers.get("x-cache");
      const xMode = response.headers.get("x-mode");
      if (xCache) setCacheStatus(xCache.toUpperCase());
      if (xMode) setAppMode(xMode.toUpperCase());

      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

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

      setSentiment(data);
      setFeed(data.feed ?? []);
      pushRecentTicker(symbol);
      setLoading(false);

      setChartLoading(true);
      try {
        const historyResponse = await fetch(`${API_BASE_URL}/sentiment/history/${symbol}`)
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

    } catch {
      setRequestError("SERVER_OFFLINE");
    } finally {
      setLoading(false);
    }
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

  const trendStats = deriveTrendStats(history);
  const driverItems = pickDrivers({ sentiment, feed });

    const landing = !sentiment && !loading && !requestError;

   return (
    <div
      className="min-h-screen w-full px-6 lg:px-12 py-10"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto w-full max-w-[1320px] space-y-10">
        <header className="header-premium flex items-start justify-between pb-2">
          <div>
            <img src="/logo.svg" alt="Pioni" className="h-28 -mt-6 -ml-8" />
            <p className="text-base text-[var(--text-secondary)] -mt-1">
              Quick read on how the market is feeling about a ticker.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] mt-4">
            <span className={`h-2 w-2 rounded-full ${appMode === "LIVE" ? "bg-emerald-400" : appMode === "MOCK" ? "bg-zinc-400" : "bg-zinc-400"}`}></span>
            <span className="font-medium text-[var(--text-secondary)]">
              {appMode ? appMode : "—"}
            </span>
            {cacheStatus && appMode === "LIVE" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--card-border)] bg-[var(--bg)] text-[var(--text-muted)]">
                {cacheLabel(cacheStatus)}
              </span>
            )}
          </div>
        </header>

        <section
          className={`relative ${landing ? "lg:min-h-[62vh] flex items-center justify-center" : ""}`}
        >
          <div aria-hidden className="hero-glow" />

          <div className="relative grid gap-10 lg:gap-12 lg:grid-cols-2 w-full items-stretch">
          <div className="flex flex-col gap-5 h-full">
            <div
              className={`card-premium rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-6 flex flex-col ${
                landing ? "min-h-[320px] sm:min-h-[360px]" : ""
              }`}
            >
              {!loading ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-sm font-medium text-[var(--text-primary)]">Ticker</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Enter a stock symbol (1-5 letters). Example: TSLA.
                    </p>
                  </div>

                  <div className={landing ? "flex-1 flex flex-col justify-center" : ""}>
                    <div className="space-y-2">
                      <label className="sr-only" htmlFor="ticker-input">
                        Ticker
                      </label>

                      <input
                        id="ticker-input"
                        type="text"
                        placeholder="Example: TSLA"
                        value={ticker}
                        onChange={handleTickerChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") fetchSentiment();
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#EDEDED]
                                  border border-[var(--card-border)]
                                  text-[var(--text-primary)] text-sm
                                  focus:ring-2 focus:ring-[var(--accent)]"
                      />

                      {tickerError && (
                        <p className="text-[10px] text-red-500 font-medium">
                          {tickerError}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">
                          Quick picks
                        </p>
                        {QUICK_PICKS.map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => fetchSentiment(sym)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--card-border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-white transition"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={fetchSentiment}
                      disabled={loading || ticker.length === 0}
                      className="btn-premium w-full mt-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? "hold on, cooking..." : "Get sentiment"}
                    </button>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Score
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {sentiment ? (sentiment.sentiment ?? 0).toFixed(2) : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Confidence
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {sentiment ? `${Math.round((sentiment.confidence ?? 0) * 100)}%` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Mentions
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {sentiment
                            ? (Number.isFinite(sentiment?.n_news) || Number.isFinite(sentiment?.n_reddit)
                                ? (Number(sentiment?.n_news || 0) + Number(sentiment?.n_reddit || 0))
                                : (feed?.length ?? "—"))
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {recentTickers.length > 0 && (
                      <div className="mt-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                            Recent
                          </p>
                          <button
                            type="button"
                            onClick={clearRecentTickers}
                            className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition bg-transparent border-none p-0"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {recentTickers.map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => fetchSentiment(sym)}
                              className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--card-border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg)] transition"
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {landing && (
                      <div className="mt-5 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Features of this legendary app
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                          <li>• Combined sentiment score with confidence</li>
                          <li>• 7-day trend snapshot</li>
                          <li>• Recent headlines and Reddit mentions</li>
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>
                        Sources: <span className="text-[var(--text-secondary)]">News</span> + <span className="text-[var(--text-secondary)]">Reddit</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-40" />
                        Rate limits apply
                      </span>
                    </div>
                  </div>

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
              <div className="card-premium mt-3 w-full rounded-xl p-5 border border-[var(--card-border)] space-y-4">
                <div className="h-4 w-20 skeleton"></div>
                <div className="h-8 w-32 skeleton"></div>
                <div className="h-3 w-full skeleton"></div>
                <div className="h-3 w-4/5 skeleton"></div>
                <div className="h-2 w-full skeleton mt-3"></div>
              </div>
            )}

            {sentiment && (
              <div className="card-premium mt-3 w-full rounded-xl p-5 border border-[var(--card-border)]">
                
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

                {sentiment?.sources && (
                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">
                      Breakdown by source
                    </p>

                    {Object.entries(sentiment.sources).map(([source, value]) => {
                      const count =
                        source === "newsapi"
                          ? sentiment?.n_news ?? 0
                          : source === "reddit"
                          ? sentiment?.n_reddit ?? 0
                          : null;

                      return (
                        <div key={source} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">
                            {source === "newsapi" ? "News" : source === "reddit" ? "Reddit" : source}
                            {count !== null ? ` (${count})` : ""}
                          </span>

                          <span className="font-medium tabular-nums">{formatSigned(value ?? 0, 3)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {sentiment?.computed_at && (
                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">Data quality</p>

                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label="Updated"
                        value={timeAgoFromIso(sentiment.computed_at)}
                        hint={formatAsOf(sentiment.computed_at)}
                      />

                      <Chip
                        label="Coverage"
                        value={`News ${sentiment?.n_news ?? 0} • Reddit ${sentiment?.n_reddit ?? 0}`}
                      />

                      <Chip
                        label="Agreement"
                        value={agreementLabel(sentiment?.confidence_drivers?.agreement)}
                        hint={pct(sentiment?.confidence_drivers?.agreement)}
                      />

                      <Chip
                        label="Dispersion"
                        value={dispersionLabel(sentiment?.confidence_drivers?.std)}
                        hint={`σ ${(Number(sentiment?.confidence_drivers?.std) || 0).toFixed(3)}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col h-full">
            <div className="card-premium chart-card flex-1 min-h-[320px] sm:min-h-[360px] rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-2xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  7-day sentiment trend
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Simple rolling view based on the latest checks.
                </p>
              </div>

              {chartLoading && <ChartSkeleton />}

              {!chartLoading && historyChartData && (
                <Suspense fallback={<ChartSkeleton />}>
                  <SentimentChart data={historyChartData} />
                </Suspense>
              )}

              {!chartLoading && !historyChartData && sentiment && (
                <EmptyStatePanel
                  variant="history"
                  title="No history for this ticker"
                  body="The mock backend only returns a short window for some tickers while building."
                />
              )}

              {!chartLoading && !sentiment && <TrendEmptyPreview />}

              {sentiment && !chartLoading && (
                <div className="mt-5 pt-4 border-t border-[var(--card-border)] space-y-4">
                  <TrendSummary stats={trendStats} />
                  <TrendDrivers items={driverItems} />
                </div>
              )}
            </div>
          </div>
          </div>
        </section>


        {sentiment && (
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

            {feed && feed.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {feed.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {sentiment && feed && feed.length === 0 && (
              <EmptyStatePanel
                variant="history"
                title="No posts to show yet"
                body="We couldn't pull any recent headlines or Reddit posts for this ticker in mock mode."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default App;