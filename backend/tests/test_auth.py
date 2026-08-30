import pytest

from app.routers import auth


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    auth._rate_attempts.clear()
    yield
    auth._rate_attempts.clear()


def test_register_creates_account_and_login_succeeds(client):
    register = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert register.status_code == 201
    body = register.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]

    login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    assert login.json()["access_token"]


def test_register_duplicate_email_returns_409(client):
    payload = {"email": "bob@example.com", "password": "secret123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 409


def test_login_wrong_password_returns_401(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": "secret123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "carol@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_unknown_email_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "secret123"},
    )
    assert response.status_code == 401


def test_rate_limit_returns_429_after_ten_requests(client):
    for _ in range(10):
        response = client.post(
            "/api/auth/login",
            json={"email": "x@example.com", "password": "wrong"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/api/auth/login",
        json={"email": "x@example.com", "password": "wrong"},
    )
    assert blocked.status_code == 429
