import time
import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.testclient import TestClient
import gateway.auth as auth
from gateway.auth import verify_token
from gateway.main import app

ISSUER = "https://clerk.example.com"


@pytest.fixture
def rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(autouse=True)
def _configure(monkeypatch, rsa_key):
    monkeypatch.setenv("CLERK_ISSUER", ISSUER)
    monkeypatch.setenv("CLERK_JWKS_URL", f"{ISSUER}/.well-known/jwks.json")
    monkeypatch.delenv("CLERK_AUTHORIZED_PARTIES", raising=False)
    auth._jwks_client = None

    class _SigningKey:
        key = rsa_key.public_key()

    class _Client:
        def get_signing_key_from_jwt(self, token):
            return _SigningKey()

    monkeypatch.setattr(auth, "_get_jwks_client", lambda: _Client())
    yield
    auth._jwks_client = None


def _make_token(rsa_key, **overrides):
    now = int(time.time())
    claims = {
        "sub": "user_123",
        "iss": ISSUER,
        "iat": now,
        "exp": now + 300,
        "sid": "sess_abc",
    }
    claims.update(overrides)
    return pyjwt.encode(claims, rsa_key, algorithm="RS256")


def test_verify_valid_token(rsa_key):
    ctx = verify_token(_make_token(rsa_key))
    assert ctx.clerk_id == "user_123"
    assert ctx.session_id == "sess_abc"


def test_expired_token_rejected(rsa_key):
    with pytest.raises(HTTPException) as exc:
        verify_token(_make_token(rsa_key, exp=int(time.time()) - 10))
    assert exc.value.status_code == 401


def test_wrong_issuer_rejected(rsa_key):
    with pytest.raises(HTTPException) as exc:
        verify_token(_make_token(rsa_key, iss="https://evil.example.com"))
    assert exc.value.status_code == 401


def test_missing_subject_rejected(rsa_key):
    token = _make_token(rsa_key)
    payload = pyjwt.decode(token, options={"verify_signature": False})
    del payload["sub"]
    stripped = pyjwt.encode(payload, rsa_key, algorithm="RS256")
    with pytest.raises(HTTPException) as exc:
        verify_token(stripped)
    assert exc.value.status_code == 401


def test_authorized_party_enforced(monkeypatch, rsa_key):
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "https://app.example.com")
    with pytest.raises(HTTPException) as exc:
        verify_token(_make_token(rsa_key))
    assert exc.value.status_code == 401
    ctx = verify_token(_make_token(rsa_key, azp="https://app.example.com"))
    assert ctx.clerk_id == "user_123"


def test_unconfigured_verifier_fails_closed(monkeypatch, rsa_key):
    monkeypatch.delenv("CLERK_ISSUER", raising=False)
    token = _make_token(rsa_key)
    with pytest.raises(HTTPException) as exc:
        verify_token(token)
    assert exc.value.status_code == 503


def test_me_endpoint_returns_identity(rsa_key):
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.get(
        "/me", headers={"Authorization": f"Bearer {_make_token(rsa_key)}"},
    )
    assert resp.status_code == 200
    assert resp.json()["clerk_id"] == "user_123"


def test_me_requires_bearer_token():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/me").status_code == 401
