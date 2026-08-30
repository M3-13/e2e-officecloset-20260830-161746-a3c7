import pytest

from app.routers import auth


@pytest.fixture(autouse=True)
def _clear_rate_limit():
    auth._request_log.clear()
    yield
    auth._request_log.clear()


def test_register_creates_account_and_login(client):
    register_response = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "secret123"},
    )
    assert register_response.status_code == 201
    body = register_response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "secret123"},
    )
    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["token_type"] == "bearer"
    assert login_body["access_token"]


def test_login_wrong_password_returns_401(client):
    client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "secret123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_unknown_email_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "secret123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_register_duplicate_email_returns_409(client):
    payload = {"email": "user@example.com", "password": "secret123"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"] == "Email already registered"


def test_rate_limit_returns_429_after_ten_requests(client):
    for _ in range(10):
        response = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "secret123"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "secret123"},
    )
    assert blocked.status_code == 429
