import pytest
from sqlalchemy.orm import sessionmaker

from app import models
from app.config import settings
from app.security import create_access_token

MAX = 5 * 1024 * 1024


@pytest.fixture
def upload_dir(tmp_path, monkeypatch):
    d = tmp_path / "uploads"
    d.mkdir()
    monkeypatch.setattr(settings, "upload_dir", str(d))
    return d


@pytest.fixture
def db_session(engine):
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def _create_user(db, email):
    user = models.User(email=email, password_hash="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_item(db, user, name="Shirt", category="Tops"):
    item = models.WardrobeItem(user_id=user.id, name=name, category=category)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _auth_headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_upload_ok(client, db_session, upload_dir):
    user = _create_user(db_session, "owner@example.com")
    item = _create_item(db_session, user)
    files = {"file": ("photo.png", b"\x89PNG\r\n\x1a\nfakedata", "image/png")}

    response = client.post(
        f"/api/wardrobe/{item.id}/image",
        headers=_auth_headers(user),
        files=files,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == item.id
    assert body["image_url"].startswith("/api/uploads/")

    filename = body["image_url"].rsplit("/", 1)[1]
    saved = upload_dir / filename
    assert saved.is_file()

    fetched = client.get(f"/api/uploads/{filename}")
    assert fetched.status_code == 200
    assert fetched.content == b"\x89PNG\r\n\x1a\nfakedata"


def test_upload_too_large(client, db_session, upload_dir):
    user = _create_user(db_session, "owner@example.com")
    item = _create_item(db_session, user)
    big = b"0" * (MAX + 1024)
    files = {"file": ("huge.png", big, "image/png")}

    response = client.post(
        f"/api/wardrobe/{item.id}/image",
        headers=_auth_headers(user),
        files=files,
    )

    assert response.status_code == 413


def test_upload_wrong_type(client, db_session, upload_dir):
    user = _create_user(db_session, "owner@example.com")
    item = _create_item(db_session, user)
    files = {"file": ("doc.txt", b"hello", "text/plain")}

    response = client.post(
        f"/api/wardrobe/{item.id}/image",
        headers=_auth_headers(user),
        files=files,
    )

    assert response.status_code == 415


def test_upload_foreign_item(client, db_session, upload_dir):
    owner = _create_user(db_session, "owner@example.com")
    other = _create_user(db_session, "other@example.com")
    item = _create_item(db_session, owner)
    files = {"file": ("photo.png", b"data", "image/png")}

    response = client.post(
        f"/api/wardrobe/{item.id}/image",
        headers=_auth_headers(other),
        files=files,
    )

    assert response.status_code == 404


def test_upload_unauthenticated(client, db_session, upload_dir):
    user = _create_user(db_session, "owner@example.com")
    item = _create_item(db_session, user)
    files = {"file": ("photo.png", b"data", "image/png")}

    response = client.post(
        f"/api/wardrobe/{item.id}/image",
        files=files,
    )

    assert response.status_code == 401
