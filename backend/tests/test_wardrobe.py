from sqlalchemy.orm import Session, sessionmaker

from app import models
from app.security import create_access_token, hash_password


def _create_user(db: Session, email: str) -> models.User:
    user = models.User(email=email, password_hash=hash_password("secret123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth_headers(user: models.User) -> dict[str, str]:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def _db(engine) -> Session:
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return factory()


def test_list_requires_auth(client):
    assert client.get("/api/wardrobe").status_code == 401


def test_create_requires_auth(client):
    response = client.post("/api/wardrobe", json={"name": "Hemd", "category": "Oberteil"})
    assert response.status_code == 401


def test_create_and_list_item(client, engine):
    db = _db(engine)
    user = _create_user(db, "wardrobe@example.com")
    db.close()

    headers = _auth_headers(user)
    created = client.post(
        "/api/wardrobe", json={"name": "Hemd", "category": "Oberteil"}, headers=headers
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Hemd"
    assert body["category"] == "Oberteil"
    assert body["image_url"] is None

    listed = client.get("/api/wardrobe", headers=headers)
    assert listed.status_code == 200
    items = listed.json()
    assert len(items) == 1
    assert items[0]["id"] == body["id"]
    assert items[0]["name"] == "Hemd"


def test_filter_by_category(client, engine):
    db = _db(engine)
    user = _create_user(db, "filter@example.com")
    db.close()

    headers = _auth_headers(user)
    client.post("/api/wardrobe", json={"name": "Hemd", "category": "Oberteil"}, headers=headers)
    client.post("/api/wardrobe", json={"name": "Jeans", "category": "Hose"}, headers=headers)

    response = client.get("/api/wardrobe", params={"category": "Hose"}, headers=headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["name"] == "Jeans"

    empty = client.get("/api/wardrobe", params={"category": "Schuhe"}, headers=headers)
    assert empty.status_code == 200
    assert empty.json() == []


def test_update_item(client, engine):
    db = _db(engine)
    user = _create_user(db, "update@example.com")
    db.close()

    headers = _auth_headers(user)
    created = client.post(
        "/api/wardrobe", json={"name": "Hemd", "category": "Oberteil"}, headers=headers
    )
    item_id = created.json()["id"]

    updated = client.patch(
        f"/api/wardrobe/{item_id}", json={"name": "Weißes Hemd"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Weißes Hemd"
    assert updated.json()["category"] == "Oberteil"


def test_delete_item(client, engine):
    db = _db(engine)
    user = _create_user(db, "delete@example.com")
    db.close()

    headers = _auth_headers(user)
    created = client.post(
        "/api/wardrobe", json={"name": "Hemd", "category": "Oberteil"}, headers=headers
    )
    item_id = created.json()["id"]

    deleted = client.delete(f"/api/wardrobe/{item_id}", headers=headers)
    assert deleted.status_code == 204

    listed = client.get("/api/wardrobe", headers=headers)
    assert listed.json() == []


def test_missing_item_returns_404(client, engine):
    db = _db(engine)
    user = _create_user(db, "missing@example.com")
    db.close()

    headers = _auth_headers(user)
    patch = client.patch("/api/wardrobe/999", json={"name": "X"}, headers=headers)
    assert patch.status_code == 404

    delete = client.delete("/api/wardrobe/999", headers=headers)
    assert delete.status_code == 404


def test_foreign_item_returns_404(client, engine):
    db = _db(engine)
    owner = _create_user(db, "owner@example.com")
    other = _create_user(db, "other@example.com")
    other_id = other.id
    item = models.WardrobeItem(user_id=owner.id, name="Geheim", category="Accessoire")
    db.add(item)
    db.commit()
    db.refresh(item)
    item_id = item.id
    db.close()

    token = create_access_token(other_id)
    headers = {"Authorization": f"Bearer {token}"}
    patch = client.patch(f"/api/wardrobe/{item_id}", json={"name": "Geändert"}, headers=headers)
    assert patch.status_code == 404

    delete = client.delete(f"/api/wardrobe/{item_id}", headers=headers)
    assert delete.status_code == 404
