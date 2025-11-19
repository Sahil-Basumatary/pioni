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

    // quick mock data for chart (temporary until backend provides history)
  const chartData = sentiment
    ? {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Sentiment trend",
            data: Array.from({ length: 7 }, () =>
              Number((sentiment.sentiment + (Math.random() - 0.5) * 0.3).toFixed(2))
            ),
            borderColor: "rgba(99, 102, 241, 0.9)",
            backgroundColor: "rgba(99, 102, 241, 0.4)",
            tension: 0.3
          }
        ]
      }
    : null;

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
  <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
    <h1 className="text-3xl font-bold mb-6">Pioni Sentiment Checker</h1>

    <div className="w-full max-w-md">
      <input
        type="text"
        placeholder="Enter stock ticker (e.g. TSLA)"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        className="w-full px-4 py-2 text-black rounded"
      />
      <button
        onClick={fetchSentiment}
        disabled={loading}
        className={`mt-4 w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded 
        ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="loader"></div>
            <span>hold on, cooking...</span>
          </div>
        ) : (
          "Get Sentiment"
        )}
      </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/90 border border-red-400 rounded-lg text-sm shadow-sm">
            {error}
          </div>
        )}

        {sentiment && (
          <div className="mt-6 w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm uppercase tracking-wide text-gray-400">
                {sentiment.ticker}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                {getSentimentLabel(sentiment.sentiment)}
              </span>
            </div>

            <p className="text-4xl font-semibold">
              {sentiment.sentiment.toFixed(2)}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Combined mood from news and reddit
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Confidence</p>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${Math.round((sentiment.confidence ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {chartLoading && (
          <div className="w-full max-w-2xl mt-8 p-4 bg-gray-800 rounded-lg animate-pulse">
            <div className="h-5 w-40 bg-gray-700 rounded mb-4"></div>
            <div className="h-40 w-full bg-gray-700 rounded"></div>
          </div>
        )}
        
        {sentiment && chartData && (
          <div className="mt-8 w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
            <h2 className="text-sm text-gray-400 mb-3">Last 7 days (mocked)</h2>
            <Line data={chartData} />
          </div>
        )}

        {!chartLoading && historyChartData && (
          <div className="w-full max-w-2xl mt-8 p-4 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-white">
              7-Day Sentiment Trend
            </h2>
            <Line data={historyChartData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;