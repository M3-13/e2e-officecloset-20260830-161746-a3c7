from pathlib import Path

from sqlalchemy.orm import sessionmaker

from app import models
from app.config import settings
from app.security import create_access_token, hash_password


def _seed_user(engine, upload_dir: Path) -> tuple[int, str]:
    session_factory = sessionmaker(bind=engine)
    with session_factory() as db:
        user = models.User(email="delete@example.com", password_hash=hash_password("secret123"))
        db.add(user)
        db.flush()

        item = models.WardrobeItem(
            user_id=user.id,
            name="Hemd",
            category="Oberteile",
            image_url="/api/uploads/hemd.png",
        )
        db.add(item)
        db.flush()

        item_without_image = models.WardrobeItem(
            user_id=user.id, name="Hose", category="Hosen", image_url=None
        )
        db.add(item_without_image)

        outfit = models.Outfit(user_id=user.id, name="Sommerlook")
        outfit.items.append(item)
        db.add(outfit)

        db.commit()
        user_id = user.id

    (upload_dir / "hemd.png").write_bytes(b"fake-image-bytes")
    token = create_access_token(user_id)
    return user_id, token


def test_delete_account_removes_everything(client, engine, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    user_id, token = _seed_user(engine, tmp_path)

    response = client.delete("/api/account", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204

    session_factory = sessionmaker(bind=engine)
    with session_factory() as db:
        assert db.get(models.User, user_id) is None
        assert db.query(models.WardrobeItem).count() == 0
        assert db.query(models.Outfit).count() == 0
        assert db.execute(models.outfit_items.select()).fetchall() == []

    assert not (tmp_path / "hemd.png").exists()


def test_delete_account_rejects_old_token(client, engine, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    _, token = _seed_user(engine, tmp_path)

    assert (
        client.delete("/api/account", headers={"Authorization": f"Bearer {token}"}).status_code
        == 204
    )

    follow_up = client.delete("/api/account", headers={"Authorization": f"Bearer {token}"})
    assert follow_up.status_code == 401


def test_delete_account_requires_auth(client):
    response = client.delete("/api/account")
    assert response.status_code == 401
