import pytest
from gateway.market_routes import _price_cache
from gateway.me_routes import _portfolio_id_cache


@pytest.fixture(autouse=True)
def _clear_caches():
    _portfolio_id_cache.clear()
    _price_cache.clear()
    yield
    _portfolio_id_cache.clear()
    _price_cache.clear()
