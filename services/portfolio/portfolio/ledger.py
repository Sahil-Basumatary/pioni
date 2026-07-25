from __future__ import annotations
import re
from dataclasses import dataclass
from decimal import Decimal
from common import OrderSide

_QUOTE_SUFFIX = re.compile(r"(USDT|USDC|USD)$", re.IGNORECASE)

_ASSET_NAME: dict[str, str] = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "SOL": "Solana",
    "XRP": "XRP",
    "USD": "US Dollar",
}


@dataclass(frozen=True, slots=True)
class LedgerLeg:
    entry_type: str
    wallet: str
    asset: str
    ticker: str
    amount: Decimal
    fee: Decimal
    balance_after: Decimal


def base_asset(symbol: str) -> str:
    return _QUOTE_SUFFIX.sub("", symbol) or symbol


def asset_display_name(ticker: str) -> str:
    return _ASSET_NAME.get(ticker, ticker)


def legs_for_fill(
    *,
    side: OrderSide,
    symbol: str,
    quantity: Decimal,
    price: Decimal,
    fee: Decimal,
    cash_balance_after: Decimal,
    asset_balance_after: Decimal,
) -> tuple[LedgerLeg, LedgerLeg]:
    ticker = base_asset(symbol)
    is_buy = side == OrderSide.BUY
    entry_type = "trade_buy" if is_buy else "trade_sell"
    cash = quantity * price
    asset_amount = quantity if is_buy else -quantity
    cash_amount = -cash if is_buy else cash
    return (
        LedgerLeg(
            entry_type=entry_type,
            wallet="Spot",
            asset=asset_display_name(ticker),
            ticker=ticker,
            amount=asset_amount,
            fee=Decimal(0),
            balance_after=asset_balance_after,
        ),
        LedgerLeg(
            entry_type=entry_type,
            wallet="Spot",
            asset=asset_display_name("USD"),
            ticker="USD",
            amount=cash_amount,
            fee=fee,
            balance_after=cash_balance_after,
        ),
    )


def format_ledger_amount(amount: Decimal, ticker: str) -> str:
    if amount == 0:
        return f"0 {ticker}"
    sign = "" if amount > 0 else "−"
    return f"{sign}{abs(amount)} {ticker}"
