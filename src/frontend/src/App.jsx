import { useState } from "react";

function App() {
  // State hooks to manage ticker input, sentiment data, loading status, and error messages
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch sentiment data for the given ticker from the backend API
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
      // Check if response is successful
      if (!response.ok) {
        // Throw error if response status indicates failure
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

  