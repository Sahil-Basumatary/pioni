import { useState } from "react";
import "./loader.css";

function App() {
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      </div>
    </div>
  );
}

export default App;