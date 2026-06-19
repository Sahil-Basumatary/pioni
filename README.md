<a id="readme-top"></a>

<div align="center">

# Pioni

<p>
  <a href="https://github.com/Sahil-Basumatary/pioni/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Sahil-Basumatary/pioni/ci.yml?branch=main&style=for-the-badge&label=Tests" alt="Tests">
  </a>
  <a href="https://github.com/Sahil-Basumatary/pioni/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-PolyForm_Noncommercial-red.svg?style=for-the-badge" alt="License: PolyForm Noncommercial">
  </a>
  <a href="https://linkedin.com/in/sahil-basumatary">
    <img src="https://img.shields.io/badge/-LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
</p>

A live trading intelligence platform that transforms social sentiment and news into actionable insights before the market moves.

</div>

## Demo

<div align="center">
  <a href="https://pioni.ai">
    <img src="https://img.shields.io/badge/Live-pioni.ai-blue?style=for-the-badge" alt="Live Demo">
  </a>
  <br/><br/>
  <img src="docs/demo.gif" alt="Demo preview" width="900" />
</div>

### Tech Stack

| Area           | Stack |
| -------------- | ----- |
| **Backend**    | [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/) [![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=for-the-badge&logo=upstash&logoColor=white)](https://upstash.com/) [![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org/) |
| **NLP**        | [![HuggingFace](https://img.shields.io/badge/FinBERT-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/ProsusAI/finbert) [![VADER](https://img.shields.io/badge/VADER-4B8BBE?style=for-the-badge)](https://github.com/cjhutto/vaderSentiment) |
| **Data**       | [![NewsAPI](https://img.shields.io/badge/NewsAPI-1A1A1A?style=for-the-badge)](https://newsapi.org/) [![Reddit](https://img.shields.io/badge/Reddit_API-FF4500?style=for-the-badge&logo=reddit&logoColor=white)](https://www.reddit.com/dev/api/) |
| **Frontend**   | [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/) [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/) |
| **Infrastructure** | [![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions) [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/) |

## Quality Gates

- **Frontend unit/component tests:** 10 Vitest tests covering Redux state, RTK Query integration, and the trading symbol selector.
- **Browser E2E tests:** 3 stubbed Cypress tests for the trading critical path, plus 5 live-stack smoke checks for gateway, market data, orders, and WebSocket connectivity.
- **CI enforcement:** GitHub Actions runs Python lint/tests, frontend lint/typecheck, coverage with a ratcheting baseline, stubbed Cypress E2E, and the production build.
- **Coverage baseline:** Frontend coverage currently starts at 6% global lines/statements while the larger legacy pages are backfilled; the threshold prevents regression and is designed to be raised as coverage expands.

## Technical Highlights

**What I learned and implemented throughout building this:**

- **Dual NLP Scoring Engine** — I Combined VADER with FinBERT using a weighted blend (35% VADER + 65% FinBERT). FinBERT runs only on the top 12 most polarized items to balance accuracy with latency.

- **Stale-While-Revalidate Caching** — Implemented SWR pattern with dual-layer caching (in-memory + Redis). Stale responses are served instantly while background refresh happens asynchronously, cutting perceived latency to near-zero for repeat queries.

- **Rate Limiting** — Built a sliding-window rate limiter from scratch using `deque`. Tracks requests per IP per endpoint with configurable windows, returning proper 429 responses with CORS headers.

- **Age-Weighted Scoring** — Applied exponential decay to sentiment scores based on content age (48-hour half-life). Recent news weighs more than stale posts, improving signal quality.

- **Async Concurrent Fetching** — Used `asyncio.gather()` with `asyncio.to_thread()` to parallelize NewsAPI and Reddit fetches. Both sources load simultaneously instead of sequentially.

- **Cache Pre-Warming** — Server startup triggers background HTTP requests to pre-populate cache for popular tickers such as TSLA, AAPL, NVDA, etc., ensuring users get instant responses.

- **Standardized Error Responses** — Every error includes `error` code, readable `message`, and `request_id` for debugging. 

- **Load Testing** — Wrote async load tests with `aiohttp` that fire concurrent requests. Validated 100% success rate with ~5ms average response time under load.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React SPA)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Dashboard  │  │   Ticker    │  │  Evidence   │  │  Trend Charts   │  │
│  │   Panel     │  │   Search    │  │    Feed     │  │   (Chart.js)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         └────────────────┴────────────────┴──────────────────┘           │
│                                   │                                      │
│                          Fetch via REST API                              │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTP
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            SERVER (FastAPI)                              │
│                                                                          │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────────────┐  │
│  │  Rate Limiter  │───▶│  Request ID    │───▶│   /sentiment/{ticker}  │  │
│  │  (30 req/min)  │    │  Middleware    │    │   /sentiment/history   │  │
│  └────────────────┘    └────────────────┘    │   /sentiment/feed      │  │
│                                              └───────────┬────────────┘  │
│                                                          │               │
│  ┌───────────────────────────────────────────────────────┼────────────┐  │
│  │                      TTL Cache (SWR)                  │            │  │
│  │              ┌──────────────┬──────────────┐          │            │  │
│  │              │  In-Memory   │ Upstash Redis│          │            │  │
│  │              └──────────────┴──────────────┘          │            │  │
│  └───────────────────────────────────────────────────────┼────────────┘  │
│                                                          │               │
│  ┌───────────────────────────────────────────────────────┼────────────┐  │
│  │                   Sentiment Service                   │            │  │
│  │    ┌─────────────────────┬─────────────────────┐      │            │  │
│  │    │      NewsAPI        │       Reddit        │◀─────┘            │  │
│  │    │   (20 articles)     │  (stocks, wsb, inv) │                   │  │
│  │    └──────────┬──────────┴──────────┬──────────┘                   │  │
│  │               └──────────┬──────────┘                              │  │
│  │                          ▼                                         │  │
│  │    ┌─────────────────────────────────────────┐                     │  │
│  │    │           Scoring Engine                │                     │  │
│  │    │  VADER (fast) + FinBERT (top 12 items)  │                     │  │
│  │    │  Age-weighted • Confidence calculation  │                     │  │
│  │    └─────────────────────────────────────────┘                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
pioni/
├── src/
│   ├── backend/                   # FastAPI server
│   │   ├── api/
│   │   │   └── routes.py          # API endpoints
│   │   ├── core/
│   │   │   ├── cache.py           # SWR cache + Redis
│   │   │   ├── errors.py          # Standardized error responses
│   │   │   ├── middleware.py      # Request ID attachment
│   │   │   └── ratelimit.py       # Sliding window limiter
│   │   ├── services/
│   │   │   ├── feed.py            # Feed generation
│   │   │   ├── history.py         # Historical sentiment
│   │   │   ├── scoring.py         # VADER + FinBERT blend
│   │   │   └── sentiment.py       # Main sentiment orchestration
│   │   ├── tests/                 # Pytest test suite
│   │   ├── main.py                # FastAPI app + pre-warming
│   │   ├── settings.py            # Environment config
│   │   └── requirements.txt
│   │
│   └── frontend/                  # React SPA
│       ├── src/
│       │   ├── App.jsx            # Main dashboard component
│       │   ├── App.css            # Custom styles
│       │   └── loader.css         # Loading animations
│       ├── public/
│       ├── tailwind.config.js
│       └── package.json
│
├── docs/
│   └── ui_sketches/               # UI design references
│
├── .github/workflows/
│   └── ci.yml                     # GitHub Actions pipeline
│
└── vercel.json                    # Deployment config
```

## Features

### Sentiment Analysis
- Real-time sentiment scoring from -1 to +1 
- Dual-source data aggregation (NewsAPI + Reddit)
- Confidence score based on volume, agreement, and source mix
- Evidence feed with direct links to source articles & posts

### Caching & Performance
- Stale-While-Revalidate pattern for instant responses
- Dual-layer cache (in-memory + Redis)
- Configurable TTL of 5 min as default and stale window of 1 min
- Background refresh without blocking user requests

### Security & Reliability
- Per-IP rate limiting of 30 req/min as default
- Request ID tracking for debugging
- Standardized error responses with proper HTTP status codes

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/sentiment/{ticker}` | Get sentiment analysis for a ticker |
| `GET` | `/sentiment/history/{ticker}` | Get historical sentiment data |
| `GET` | `/sentiment/feed/{ticker}` | Get recent news/reddit feed for ticker |

### Response Headers

| Header | Values | Description |
|--------|--------|-------------|
| `X-Cache` | `HIT`, `MISS`, `STALE`, `MOCK` | Cache status |
| `X-Mode` | `LIVE`, `MOCK` | Operating mode |
| `X-Request-ID` | UUID | Unique request identifier |

### Example Response

```json
{
  "ticker": "TSLA",
  "sentiment": 0.2341,
  "sources": {
    "newsapi": 0.1823,
    "reddit": 0.2859
  },
  "confidence": 0.7234,
  "n_news": 15,
  "n_reddit": 12,
  "computed_at": "2025-01-08T14:32:00Z",
  "highlights": [
    { "source": "newsapi", "text": "Tesla Q4 deliveries beat expectations", "score": 0.89 },
    { "source": "reddit", "text": "TSLA to the moon 🚀", "score": 0.76 }
  ],
  "evidence": [...],
  "coverage_window": {
    "start": "2025-01-06T08:00:00Z",
    "end": "2025-01-08T14:30:00Z"
  }
}
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 20+ (LTS recommended)
- API keys for [NewsAPI](https://newsapi.org/) and [Reddit](https://www.reddit.com/prefs/apps)
- (Optional) [Upstash Redis](https://upstash.com/) for distributed caching

### Clone the Repository

```bash
git clone https://github.com/Sahil-Basumatary/pioni.git
cd pioni
```

### Backend Setup

```bash
cd src/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `src/backend/.env`:

```env
MOCK=false
NEWS_API_KEY=your_newsapi_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
FINBERT_REQUIRED=true
RATE_LIMIT_ENABLED=true
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

API available at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Visit http://localhost:5173

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Testing

Backend tests use Pytest with mocked external dependencies:

```bash
cd src/backend
PYTHONPATH=../../src pytest tests/ -v
```

### Test Coverage

- [x] Health check endpoint
- [x] Mock sentiment mode
- [x] Rate limiting (429 responses)
- [x] Cache behavior (MISS → HIT)
- [x] Request ID header attachment
- [x] FinBERT 503 fallback
- [x] Historical sentiment endpoint
- [x] Load testing (concurrent requests)

---

## CI/CD

GitHub Actions runs on every push to `main`:

- **Backend Tests** — Pytest with `MOCK=true`, `FINBERT_REQUIRED=false`
- **Frontend Build** — `npm run lint` + `npm run build`
- **Artifact Upload** — Built frontend saved for 7 days

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

---

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

You may view, fork, and learn from this code for personal and educational purposes. Commercial use requires explicit permission.

See [LICENSE](LICENSE) for full terms.

---

## Contact

GitHub: [@Sahil-Basumatary](https://github.com/Sahil-Basumatary)

LinkedIn: [Sahil Basumatary](https://www.linkedin.com/in/sahil-basumatary/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
