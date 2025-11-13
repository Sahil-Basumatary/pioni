import { useState } from "react";

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
      // Handle errors such as network issues or invalid ticker
      setError("Error fetching sentiment. Check backend or enter a valid ticker.");
    } finally {
      setLoading(false);
    }
  };

// Rendering here the main UI of the sentiment checker app

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
          <div className="mt-4 p-3 bg-red-600 rounded text-sm">{error}</div>
        )}

        {sentiment && sentiment.sentiment !== undefined && (
          <div className="mt-6 p-4 bg-gray-800 rounded">
            <p className="text-lg">
              Sentiment Score:{" "}
              <span
                className={`font-bold ${
                  sentiment.sentiment > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {Number(sentiment.sentiment).toFixed(2)}
              </span>
            </p>
            <p className="text-sm mt-2 text-gray-400">
              Based on data from News headlines and Reddit :/
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;