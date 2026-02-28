from decimal import Decimal
from market_data.schemas import NormalizedTrade, NormalizedKline, TickerSnapshot


def test_normalized_trade():
    trade = NormalizedTrade(
        symbol="BTCUSDT",
        price=Decimal("67890.50"),
        quantity=Decimal("0.001"),
        timestamp=1700000000000,
        buyer_maker=False,
    )
    assert trade.exchange == "binance"
    assert trade.display_symbol() == "BTC/USDT"
    dumped = trade.model_dump()
    assert dumped["symbol"] == "BTCUSDT"
    assert dumped["price"] == Decimal("67890.50")


def test_normalized_trade_non_usdt():
    trade = NormalizedTrade(
        symbol="ETHBTC",
        price=Decimal("0.05"),
        quantity=Decimal("1.0"),
        timestamp=1700000000000,
        buyer_maker=True,
    )
    assert trade.display_symbol() == "ETHBTC"


def test_normalized_kline():
    kline = NormalizedKline(
        symbol="ETHUSDT",
        interval="1m",
        open_time=1700000000000,
        close_time=1700000059999,
        open=Decimal("2100.00"),
        high=Decimal("2105.00"),
        low=Decimal("2099.00"),
        close=Decimal("2103.50"),
        volume=Decimal("150.5"),
        quote_volume=Decimal("316012.75"),
        trades=420,
        is_closed=True,
    )
    assert kline.exchange == "binance"
    assert kline.is_closed is True
    dumped = kline.model_dump(mode="json")
    assert isinstance(dumped["open"], str)


def test_ticker_snapshot_optional_fields():
    snap = TickerSnapshot(
        symbol="SOLUSDT",
        price=Decimal("145.30"),
        updated_at=1700000000000,
    )
    assert snap.change_24h is None
    assert snap.high_24h is None
    dumped = snap.model_dump(mode="json")
    assert dumped["price"] == "145.30"
