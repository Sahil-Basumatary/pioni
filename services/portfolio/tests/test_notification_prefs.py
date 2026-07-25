from types import SimpleNamespace
from portfolio.notification_prefs import should_email_status


def _prefs(**kwargs):
    base = {
        "mode": "all",
        "email_enabled": True,
        "fills": True,
        "partial_fills": True,
        "rejections": True,
    }
    base.update(kwargs)
    return SimpleNamespace(**base)


def test_email_skips_when_disabled():
    assert should_email_status("FILLED", _prefs(email_enabled=False)) is False


def test_email_skips_mute_and_placements():
    assert should_email_status("FILLED", _prefs(mode="mute")) is False
    assert should_email_status("NEW", _prefs(mode="all")) is False


def test_email_important_statuses():
    prefs = _prefs(mode="important")
    assert should_email_status("FILLED", prefs) is True
    assert should_email_status("PARTIALLY_FILLED", prefs) is True
    assert should_email_status("REJECTED", prefs) is True
    assert should_email_status("CANCELED", prefs) is False


def test_email_custom_flags():
    prefs = _prefs(mode="custom", fills=True, partial_fills=False, rejections=True)
    assert should_email_status("FILLED", prefs) is True
    assert should_email_status("PARTIALLY_FILLED", prefs) is False
    assert should_email_status("REJECTED", prefs) is True
