import json
from decimal import Decimal
from market_data.binance import BinanceWSClient

SAMPLE_TRADE_MSG = json.dumps({
    "stream": "btcusdt@trade",
    "data": {
        "e": "trade",
        "E": 1700000000123,
        "s": "BTCUSDT",
        "t": 999999,
        "p": "67890.50",
        "q": "0.00100",
        "b": 88,
        "a": 50,
        "T": 1700000000123,
        "m": False,
        "M": True,
    },
})

SAMPLE_KLINE_MSG = json.dumps({
    "stream": "ethusdt@kline_1m",
    "data": {
        "e": "kline",
        "E": 1700000000456,
        "s": "ETHUSDT",
        "k": {
            "t": 1700000000000,
            "T": 1700000059999,
            "s": "ETHUSDT",
            "i": "1m",
            "f": 100,
            "L": 200,
            "o": "2100.00",
            "c": "2103.50",
            "h": "2105.00",
            "l": "2099.00",
            "v": "150.500",
            "n": 420,
            "x": False,
            "q": "316012.75",
            "V": "75.250",
            "Q": "158006.37",
            "B": "0",
        },
    },
})


def test_build_stream_url():
    client = BinanceWSClient(
        symbols=["BTCUSDT", "ETHUSDT"],
        kline_intervals=["1m"],
    )
    url = client._build_stream_url()
    assert "btcusdt@trade" in url
    assert "ethusdt@trade" in url
    assert "btcusdt@kline_1m" in url
    assert "ethusdt@kline_1m" in url
    assert url.startswith("wss://stream.binance.com:9443/stream?streams=")


def test_parse_trade():
    client = BinanceWSClient(symbols=["BTCUSDT"], kline_intervals=["1m"])
    raw = json.loads(SAMPLE_TRADE_MSG)
    trade = client._parse_trade(raw["data"])
    assert trade.symbol == "BTCUSDT"
    assert trade.price == Decimal("67890.50")
    assert trade.quantity == Decimal("0.00100")
    assert trade.timestamp == 1700000000123
    assert trade.buyer_maker is False


def test_parse_kline():
    client = BinanceWSClient(symbols=["ETHUSDT"], kline_intervals=["1m"])
    raw = json.loads(SAMPLE_KLINE_MSG)
    kline = client._parse_kline(raw["data"])
    assert kline.symbol == "ETHUSDT"
    assert kline.interval == "1m"
    assert kline.open == Decimal("2100.00")
    assert kline.high == Decimal("2105.00")
    assert kline.close == Decimal("2103.50")
    assert kline.volume == Decimal("150.500")
    assert kline.trades == 420
    assert kline.is_closed is False
