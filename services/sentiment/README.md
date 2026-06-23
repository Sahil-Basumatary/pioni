# Sentiment

NLP service for market sentiment analysis. Blends VADER with FinBERT for scoring across equity and crypto assets.

## Setup

```bash
cd services/sentiment
pip install -r requirements.txt
uvicorn sentiment.main:app --reload --port 8001
```

## Endpoints

- `/analyze/{ticker}` - sentiment analysis with scores, confidence, evidence
- `/feed/{ticker}` - recent news, Reddit, and X items
- `/history/{ticker}` - 7-day historical sentiment
- `/health`, `/health/live`, `/health/ready` - health checks

Crypto symbols such as `BTC`, `BTCUSDT`, `ETH`, and `SOL` are normalized before provider queries so cache keys, evidence, and event channels stay canonical.

## Config

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCK` | No | Enable mock mode (default: `true`) |
| `HF_API_TOKEN` | No | HuggingFace token for FinBERT |
| `FINBERT_REQUIRED` | No | Fail if FinBERT unavailable (default: `false`) |
| `NEWS_API_KEY` | Yes* | NewsAPI key |
| `REDDIT_CLIENT_ID` | Yes* | Reddit API credentials |
| `REDDIT_CLIENT_SECRET` | Yes* | Reddit API credentials |
| `X_BEARER_TOKEN` | No | Optional X API bearer token for crypto posts |
| `REDIS_URL` | No | Redis connection for caching |
| `SENTIMENT_PUBLISH_ENABLED` | No | Publish fresh sentiment events to Redis (default: `true`) |

*At least one data source (NewsAPI, Reddit, or X) must be configured for live mode.

## Redis Events

Fresh live analysis publishes a compact JSON event to:

```text
sentiment:updated:{ticker}
```

Example payload:

```json
{
  "ticker": "BTC",
  "asset_class": "crypto",
  "sentiment": 0.31,
  "confidence": 0.72,
  "sources": {
    "newsapi": 0.22,
    "reddit": 0.18,
    "x": 0.42
  },
  "computed_at": "2026-06-17T10:00:00Z"
}
```

## Docker

Runs on port 8001. NLTK data pre-downloaded during build. Non-root user.

```bash
docker build -f services/sentiment/Dockerfile -t pioni-sentiment .
docker run -p 8001:8001 pioni-sentiment
```
