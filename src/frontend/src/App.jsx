import { useState } from "react";

function App() {
  // State hooks to manage ticker input, sentiment data, loading status, and error messages
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // a Function to fetch sentiment data for the given ticker from the backend API
  const fetchSentiment = async () => {
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setSentiment(null);

    try {
      // Fetch sentiment data from backend API
      const response = await fetch(`http://localhost:8000/sentiment/${ticker}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sentiment data");
      }
      // Parse JSON data from response
      const data = await response.json();
      setSentiment(data);
    } catch (err) {
      // Handle errors such as network issues or invalid ticker
      setError("Error fetching sentiment. Check backend or enter a valid ticker.");
    } finally {
      setLoading(false);
    }
  };

// Renderng here the main UI of the sentiment checker app

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
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded"
        > {loading ? "Please wait" : "Get Sentiment"}</button>