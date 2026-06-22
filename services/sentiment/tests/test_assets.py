from sentiment.assets import resolve_asset


def test_resolve_crypto_pair_to_canonical_asset():
    asset = resolve_asset("BTCUSDT")

    assert asset.ticker == "BTC"
    assert asset.asset_class == "crypto"
    assert "Bitcoin" in asset.aliases
    assert "CryptoCurrency" in asset.reddit_subreddits


def test_resolve_unknown_symbol_as_equity():
    asset = resolve_asset("NVDA")

    assert asset.ticker == "NVDA"
    assert asset.asset_class == "equity"
    assert asset.news_terms == ("NVDA stock", "NVDA shares", "NVDA earnings")

