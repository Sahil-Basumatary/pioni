from portfolio.email_notify import order_email_copy


def test_order_email_copy():
    subject, text = order_email_copy(symbol="BTC-USD", side="BUY", status="FILLED")
    assert "BTC-USD" in subject
    assert "Filled" in subject
    assert "BUY" in text
    assert "paper" in text.lower()
