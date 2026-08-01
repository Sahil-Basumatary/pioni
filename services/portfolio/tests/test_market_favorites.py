from portfolio.market_favorites import normalize_symbols


def test_normalize_empty():
    assert normalize_symbols(None) == []
    assert normalize_symbols([]) == []


def test_normalize_uppercases_and_dedupes():
    assert normalize_symbols(["btcusdt", "BTCUSDT", " ethusdt "]) == [
        "BTCUSDT",
        "ETHUSDT",
    ]


def test_normalize_rejects_junk():
    assert normalize_symbols(["BTC", "bad-symbol", 12, "", "A"]) == ["BTC"]


def test_normalize_caps_at_fifty():
    raw = [f"S{i:02d}" for i in range(60)]
    out = normalize_symbols(raw)
    assert len(out) == 50
    assert out[0] == "S00"
    assert out[-1] == "S49"
