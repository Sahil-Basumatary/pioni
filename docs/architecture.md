# Architecture 

The architecture will stay lightweight during MVP, with a clear road for scaling later.

## Planned Components

**Frontend**
- TypeScript + React (or Next.js)
- Swipe-based interface inspired by mobile gestures
- Light and dark mode support

**Backend**
- Python (FastAPI or Flask)
- Endpoints for sentiment scoring and stock retrieval

**Data Layer**
- Phase 1: Public news APIs, basic scraping, or sentiment datasets
- Phase 2: Real-time social media streams (X, Reddit, disord)
- Phase 3: Custom NLP models for classification and emotion tagging

**Processing**
- Sentiment classification using existing models (e.g. VADER, transformer-based)
- Aggregation logic based on source reliability weighting
- Caching layer to prevent rate-limit issues

This document will evolve as build decisions are made and tested.