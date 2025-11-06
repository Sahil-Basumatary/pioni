from fastapi import FastAPI

app = FastAPI(title="Pioni API", version="0.1.0")

@app.get("/health")
def health_check():
    return {"status": "running"}

@app.get("/sentiment/{ticker}")
def get_sentiment(ticker: str):
    # Temporary placeholder 
    mock_score = 0.72  # 72% bullish sentiment (dummy)
    return {
        "ticker": ticker.upper(),
        "sentiment_score": mock_score,
        "confidence": 0.85, 
        "source": "placeholder-model"
    }