import pytest
from gateway.me_routes import _portfolio_id_cache


@pytest.fixture(autouse=True)
def _clear_portfolio_cache():
    _portfolio_id_cache.clear()
    yield
    _portfolio_id_cache.clear()
