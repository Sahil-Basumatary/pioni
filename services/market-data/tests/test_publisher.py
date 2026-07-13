import pytest
from decimal import Decimal
from market_data.publisher import MarketPublisher
from market_data.schemas import NormalizedTrade, NormalizedKline, Ticker24h


@pytest.fixture
def publisher():
    return MarketPublisher()


def _make_trade(symbol="BTCUSDT", price="67890.50") -> NormalizedTrade:
    return NormalizedTrade(
        symbol=symbol,
        price=Decimal(price),
        quantity=Decimal("0.001"),
        timestamp=1700000000000,
        buyer_maker=False,
    )


def _make_ticker(symbol="BTCUSDT") -> Ticker24h:
    return Ticker24h(
        symbol=symbol,
        price=Decimal("63500.00"),
        change_24h=Decimal("-1200.50"),
        change_pct_24h=-1.85,
        high_24h=Decimal("65000.00"),
        low_24h=Decimal("62000.00"),
        volume_24h=Decimal("12345.678"),
        updated_at=1700000000999,
    )


def _make_kline(symbol="BTCUSDT", open_time=1700000000000) -> NormalizedKline:
    return NormalizedKline(
        symbol=symbol,
        interval="1m",
        open_time=open_time,
        close_time=open_time + 59999,
        open=Decimal("67890.00"),
        high=Decimal("67900.00"),
        low=Decimal("67885.00"),
        close=Decimal("67895.00"),
        volume=Decimal("12.5"),
        quote_volume=Decimal("849000.00"),
        trades=150,
        is_closed=False,
    )


@pytest.mark.asyncio
async def test_handle_trade_creates_snapshot(publisher):
    trade = _make_trade()
    await publisher.handle_trade(trade)
    snap = publisher.get_snapshot("BTCUSDT")
    assert snap is not None
    assert snap.price == Decimal("67890.50")
    assert snap.symbol == "BTCUSDT"


@pytest.mark.asyncio
async def test_handle_ticker_fills_24h_stats(publisher):
    await publisher.handle_trade(_make_trade(price="67890.00"))
    await publisher.handle_ticker(_make_ticker())
    snap = publisher.get_snapshot("BTCUSDT")
    assert snap.price == Decimal("67890.00")
    assert snap.high_24h == Decimal("65000.00")
    assert snap.low_24h == Decimal("62000.00")
    assert snap.volume_24h == Decimal("12345.678")
    assert snap.change_pct_24h == -1.85


@pytest.mark.asyncio
async def test_handle_trade_preserves_24h_stats(publisher):
    await publisher.handle_ticker(_make_ticker())
    await publisher.handle_trade(_make_trade(price="64000.00"))
    snap = publisher.get_snapshot("BTCUSDT")
    assert snap.price == Decimal("64000.00")
    assert snap.high_24h == Decimal("65000.00")
    assert snap.change_pct_24h == -1.85


@pytest.mark.asyncio
async def test_handle_trade_updates_price(publisher):
    await publisher.handle_trade(_make_trade(price="67890.00"))
    await publisher.handle_trade(_make_trade(price="67900.00"))
    snap = publisher.get_snapshot("BTCUSDT")
    assert snap.price == Decimal("67900.00")


@pytest.mark.asyncio
async def test_get_all_snapshots(publisher):
    await publisher.handle_trade(_make_trade("BTCUSDT"))
    await publisher.handle_trade(_make_trade("ETHUSDT", "2100.00"))
    all_snaps = publisher.get_all_snapshots()
    assert len(all_snaps) == 2
    assert "BTCUSDT" in all_snaps
    assert "ETHUSDT" in all_snaps


@pytest.mark.asyncio
async def test_handle_kline_buffers(publisher):
    kline = _make_kline()
    await publisher.handle_kline(kline)
    result = publisher.get_klines("BTCUSDT", "1m")
    assert len(result) == 1
    assert result[0]["open_time"] == 1700000000000


@pytest.mark.asyncio
async def test_handle_kline_updates_same_candle(publisher):
    k1 = _make_kline(open_time=1700000000000)
    k2 = _make_kline(open_time=1700000000000)
    await publisher.handle_kline(k1)
    await publisher.handle_kline(k2)
    result = publisher.get_klines("BTCUSDT", "1m")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_handle_kline_appends_new_candle(publisher):
    await publisher.handle_kline(_make_kline(open_time=1700000000000))
    await publisher.handle_kline(_make_kline(open_time=1700000060000))
    result = publisher.get_klines("BTCUSDT", "1m")
    assert len(result) == 2


@pytest.mark.asyncio
async def test_get_klines_respects_limit(publisher):
    for i in range(10):
        await publisher.handle_kline(_make_kline(open_time=1700000000000 + i * 60000))
    result = publisher.get_klines("BTCUSDT", "1m", limit=5)
    assert len(result) == 5


def test_get_snapshot_missing(publisher):
    assert publisher.get_snapshot("XYZUSDT") is None


def test_get_klines_missing(publisher):
    assert publisher.get_klines("XYZUSDT", "1m") == []
