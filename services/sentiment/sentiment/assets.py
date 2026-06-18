from dataclasses import dataclass


@dataclass(frozen=True)
class AssetProfile:
    ticker: str
    asset_class: str
    display_name: str
    aliases: tuple[str, ...]
    news_terms: tuple[str, ...]
    reddit_subreddits: tuple[str, ...]
    x_accounts: tuple[str, ...]


CRYPTO_ASSETS: dict[str, AssetProfile] = {
    "BTC": AssetProfile(
        ticker="BTC",
        asset_class="crypto",
        display_name="Bitcoin",
        aliases=("BTC", "BTCUSDT", "XBT", "Bitcoin"),
        news_terms=("Bitcoin", "BTC", "BTC crypto"),
        reddit_subreddits=("CryptoCurrency", "Bitcoin", "btc", "CryptoMarkets"),
        x_accounts=("bitcoin", "DocumentingBTC", "BitcoinMagazine"),
    ),
    "ETH": AssetProfile(
        ticker="ETH",
        asset_class="crypto",
        display_name="Ethereum",
        aliases=("ETH", "ETHUSDT", "Ethereum", "Ether"),
        news_terms=("Ethereum", "ETH", "Ether crypto"),
        reddit_subreddits=("CryptoCurrency", "ethereum", "ethfinance", "CryptoMarkets"),
        x_accounts=("ethereum", "VitalikButerin", "BanklessHQ"),
    ),
    "SOL": AssetProfile(
        ticker="SOL",
        asset_class="crypto",
        display_name="Solana",
        aliases=("SOL", "SOLUSDT", "Solana"),
        news_terms=("Solana", "SOL crypto", "Solana blockchain"),
        reddit_subreddits=("CryptoCurrency", "solana", "CryptoMarkets"),
        x_accounts=("solana", "SolanaFndn"),
    ),
    "XRP": AssetProfile(
        ticker="XRP",
        asset_class="crypto",
        display_name="XRP",
        aliases=("XRP", "XRPUSDT", "Ripple"),
        news_terms=("XRP", "Ripple crypto", "XRP ledger"),
        reddit_subreddits=("CryptoCurrency", "Ripple", "XRP", "CryptoMarkets"),
        x_accounts=("Ripple", "XRPLF"),
    ),
    "ADA": AssetProfile(
        ticker="ADA",
        asset_class="crypto",
        display_name="Cardano",
        aliases=("ADA", "ADAUSDT", "Cardano"),
        news_terms=("Cardano", "ADA crypto", "Cardano blockchain"),
        reddit_subreddits=("CryptoCurrency", "cardano", "CryptoMarkets"),
        x_accounts=("Cardano", "InputOutputHK"),
    ),
    "DOGE": AssetProfile(
        ticker="DOGE",
        asset_class="crypto",
        display_name="Dogecoin",
        aliases=("DOGE", "DOGEUSDT", "Dogecoin"),
        news_terms=("Dogecoin", "DOGE crypto", "DOGE coin"),
        reddit_subreddits=("CryptoCurrency", "dogecoin", "CryptoMarkets"),
        x_accounts=("dogecoin", "DogecoinFdn"),
    ),
}

DEFAULT_EQUITY_SUBREDDITS = ("stocks", "wallstreetbets", "investing")


def resolve_asset(ticker: str) -> AssetProfile:
    normalized = ticker.upper().replace("-", "").replace("/", "")
    if normalized.endswith("USDT"):
        normalized = normalized[:-4]
    if normalized.endswith("USD") and len(normalized) > 3:
        normalized = normalized[:-3]
    crypto = CRYPTO_ASSETS.get(normalized)
    if crypto:
        return crypto
    return AssetProfile(
        ticker=normalized,
        asset_class="equity",
        display_name=normalized,
        aliases=(normalized,),
        news_terms=(f"{normalized} stock", f"{normalized} shares", f"{normalized} earnings"),
        reddit_subreddits=DEFAULT_EQUITY_SUBREDDITS,
        x_accounts=(),
    )

