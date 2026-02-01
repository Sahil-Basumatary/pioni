# Sentiment

NLP service for market sentiment analysis. Blends VADER with FinBERT for scoring.

## Setup

```bash
cd services/sentiment
pip install -r requirements.txt
uvicorn sentiment.main:app --reload --port 8001
```

## Endpoints

- `/analyze/{ticker}` - sentiment analysis with scores, confidence, evidence
- `/feed/{ticker}` - recent news/reddit items
- `/history/{ticker}` - 7-day historical sentiment
- `/health`, `/health/live`, `/health/ready` - health checks

## Config

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCK` | No | Enable mock mode (default: `true`) |
| `HF_API_TOKEN` | No | HuggingFace token for FinBERT |
| `FINBERT_REQUIRED` | No | Fail if FinBERT unavailable (default: `false`) |
| `NEWS_API_KEY` | Yes* | NewsAPI key |
| `REDDIT_CLIENT_ID` | Yes* | Reddit API credentials |
| `REDDIT_CLIENT_SECRET` | Yes* | Reddit API credentials |
| `REDIS_URL` | No | Redis connection for caching |

*At least one data source (NewsAPI or Reddit) must be configured.

## Docker

Runs on port 8001. NLTK data pre-downloaded during build. Non-root user.

```bash
docker build -f services/sentiment/Dockerfile -t pioni-sentiment .
docker run -p 8001:8001 pioni-sentiment
```
