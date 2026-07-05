# Common

Shared utilities for Pioni microservices.

## Installation

From project root:

```bash
pip install -e libs/common
```

## Modules

- **cache** - Redis + in-memory TTL cache with stale-while-revalidate
- **errors** - Standardized API error responses
- **logging** - Structured JSON logging
- **middleware** - Request ID middleware
- **ratelimit** - Sliding window rate limiter

## Usage

```python
from common.cache import TTLCache, init_redis_pool, close_redis_pool
from common.errors import raise_api_error
from common.logging import setup_logging
from common.middleware import RequestIdMiddleware
from common.ratelimit import RateLimiter, RateLimitMiddleware
```

## Design

All configuration is passed via dependency injection rather than imported from settings.
This makes the library portable across services and easier to test.
