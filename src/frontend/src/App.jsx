import { useState } from "react";
import "./loader.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from "chart.js";
import "./App.css";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

function App() {
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchSentiment = async () => {
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setSentiment(null);
    
    try {
  
      const response = await fetch(`http://127.0.0.1:8000/sentiment/${ticker}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sentiment data");
      }
      setChartLoading(true);
      const historyData = await fetchHistory(ticker);
      setHistory(historyData.history);
      setChartLoading(false);
      
      const data = await response.json();
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

  const historyChartData = history.length > 0 ? {
    labels: history.map(item => item.date),
    datasets: [{
      label: "7-Day Sentiment Trend",
      data: history.map(item => item.score),
      borderWidth: 2,
      tension: 0.25,
    }]
  } : null;

  const fetchHistory = async (ticker) => {
    const response = await fetch(`http://127.0.0.1:8000/sentiment/history/${ticker}`);
    if (!response.ok) throw new Error("Failed to fetch history");
    return await response.json();
  };
  
//main UI

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(circle at top, #0f172a 0, #020617 45%, #020617 100%)",
        color: "var(--text-primary)"
      }}
    >
      <div className="w-full max-w-5xl px-4 py-10 space-y-8">
        {/* header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Pioni Sentiment
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Quick read on how the market is feeling about a ticker.
            </p>
          </div>
          <div className="hidden md:flex items-center text-xs px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)]">
            <span className="mr-1 h-2 w-2 rounded-full bg-emerald-400"></span>
            Mock mode on
          </div>
        </header>

        {/* content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* left column: search + current sentiment */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] backdrop-blur-xl p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
                Ticker
              </label>
              <input
                type="text"
                placeholder="Example: TSLA"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0b0c10] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
              />

              <button
                onClick={fetchSentiment}
                disabled={loading}
                className="mt-4 w-full py-3 rounded-xl text-sm font-medium
                  bg-[var(--accent)]
                  hover:bg-[var(--accent-soft)]
                  transition-all
                  backdrop-blur-xl
                  shadow-[0_0_20px_rgba(76,121,255,0.35)]
                  disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? "hold on, cooking..." : "Get sentiment"}
              </button>

              {error && (
                <div className="mt-3 text-xs rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200">
                  {error}
                </div>
              )}

              {!error && !loading && !sentiment && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Try a liquid US stock ticker. This is a simple early prototype.
                </p>
              )}
            </div>

            {sentiment && (
              <div className="mt-6 w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {sentiment.ticker}
                    </p>
                    <p className="text-4xl font-semibold mt-1 leading-tight">
                      {sentiment.sentiment.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#151722] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {getSentimentLabel(sentiment.sentiment)}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  Combined mood from recent news and Reddit mentions. Values are in
                  the range -1 to 1.
                </p>

                <div className="pt-2">
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">
                    Confidence
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-[#151722] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${Math.round(
                          (sentiment.confidence ?? 0) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right column: chart */}
          <div className="flex flex-col">
            <div
              className="flex-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] backdrop-blur-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-[var(--text-primary)]">
                    7-day sentiment trend
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Simple rolling view based on the latest checks.
                  </p>
                </div>
              </div>

              {chartLoading && (
                <div className="w-full h-56 flex items-center justify-center text-xs text-[var(--text-muted)]">
                  loading chart...
                </div>
              )}

           {!chartLoading && historyChartData && (
              <div
                className="w-full mt-10 rounded-2xl shadow-xl"
                style={{
                    maxWidth: "900px",
                    padding: "2rem",
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(148, 163, 184, 0.45)",
                    backdropFilter: "blur(20px)"
                  }}
              >
                <Line
                  data={historyChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        mode: "index",
                        intersect: false
                      }
                    },
                    interaction: {
                      mode: "index",
                      intersect: false
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { color: "var(--text-muted)", font: { size: 10 } }
                      },
                      y: {
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: {
                          color: "var(--text-muted)",
                          font: { size: 10 }
                        }
                      }
                    },
                    elements: {
                      line: {
                        borderColor: "rgba(76,121,255,0.9)"
                      },
                      point: {
                        radius: 2,
                        hitRadius: 6
                      }
                    }
                  }}
                />
              </div>
            )}

              {!chartLoading && !historyChartData && sentiment && (
                <div className="w-full h-56 flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No historical sentiment data available yet.
                </div>
              )}

              {!chartLoading && !sentiment && (
                <div className="w-full h-56 flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Run a search to see charted sentiment here.
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