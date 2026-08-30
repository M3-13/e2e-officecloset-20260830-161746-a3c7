import pytest
from sqlalchemy.orm import sessionmaker

from app import models
from app.security import create_access_token


@pytest.fixture
def db_session(engine):
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    yield session
    session.close()


def _auth_headers(user_id: int) -> dict[str, str]:
    token = create_access_token(user_id)
    return {"Authorization": f"Bearer {token}"}


def _seed_user(db, email: str = "a@example.com") -> models.User:
    user = models.User(email=email, password_hash="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _seed_item(
    db,
    user: models.User,
    name: str,
    category: str = "top",
    image_url: str | None = None,
) -> models.WardrobeItem:
    item = models.WardrobeItem(user_id=user.id, name=name, category=category, image_url=image_url)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def test_outfits_endpoints_require_auth(client):
    assert client.get("/api/outfits").status_code == 401
    assert client.post("/api/outfits", json={"name": "x", "item_ids": []}).status_code == 401
    assert client.get("/api/outfits/1").status_code == 401
    assert client.patch("/api/outfits/1", json={"name": "x"}).status_code == 401
    assert client.delete("/api/outfits/1").status_code == 401


def test_create_and_list_outfit(client, db_session):
    user = _seed_user(db_session)
    item_a = _seed_item(db_session, user, "Bluse", category="top")
    item_b = _seed_item(db_session, user, "Hose", category="bottom")
    headers = _auth_headers(user.id)

    response = client.post(
        "/api/outfits",
        json={"name": "Abendlook", "item_ids": [item_a.id, item_b.id]},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Abendlook"
    assert sorted(body["item_ids"]) == sorted([item_a.id, item_b.id])

    listing = client.get("/api/outfits", headers=headers)
    assert listing.status_code == 200
    assert [o["id"] for o in listing.json()] == [body["id"]]


def test_get_outfit_detail_with_images(client, db_session):
    user = _seed_user(db_session)
    item = _seed_item(db_session, user, "Bluse", image_url="/api/uploads/bluse.jpg")
    headers = _auth_headers(user.id)

    created = client.post(
        "/api/outfits",
        json={"name": "Look", "item_ids": [item.id]},
        headers=headers,
    ).json()

    detail = client.get(f"/api/outfits/{created['id']}", headers=headers)
    assert detail.status_code == 200
    body = detail.json()
    assert body["name"] == "Look"
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == item.id
    assert body["items"][0]["image_url"] == "/api/uploads/bluse.jpg"


def test_rename_outfit(client, db_session):
    user = _seed_user(db_session)
    item = _seed_item(db_session, user, "Bluse")
    headers = _auth_headers(user.id)
    created = client.post(
        "/api/outfits",
        json={"name": "Alt", "item_ids": [item.id]},
        headers=headers,
    ).json()

    response = client.patch(
        f"/api/outfits/{created['id']}",
        json={"name": "Neu"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Neu"


def test_delete_outfit(client, db_session):
    user = _seed_user(db_session)
    item = _seed_item(db_session, user, "Bluse")
    headers = _auth_headers(user.id)
    created = client.post(
        "/api/outfits",
        json={"name": "Look", "item_ids": [item.id]},
        headers=headers,
    ).json()

    response = client.delete(f"/api/outfits/{created['id']}", headers=headers)
    assert response.status_code == 204
    assert client.get(f"/api/outfits/{created['id']}", headers=headers).status_code == 404


def test_foreign_outfit_id_returns_404(client, db_session):
    owner = _seed_user(db_session, email="owner@example.com")
    other = _seed_user(db_session, email="other@example.com")
    item = _seed_item(db_session, owner, "Bluse")
    created = client.post(
        "/api/outfits",
        json={"name": "Look", "item_ids": [item.id]},
        headers=_auth_headers(owner.id),
    ).json()

    headers = _auth_headers(other.id)
    assert client.get(f"/api/outfits/{created['id']}", headers=headers).status_code == 404
    assert (
        client.patch(
            f"/api/outfits/{created['id']}", json={"name": "Hack"}, headers=headers
        ).status_code
        == 404
    )
    assert client.delete(f"/api/outfits/{created['id']}", headers=headers).status_code == 404


def test_create_outfit_with_foreign_item_returns_404(client, db_session):
    owner = _seed_user(db_session, email="owner@example.com")
    other = _seed_user(db_session, email="other@example.com")
    foreign_item = _seed_item(db_session, other, "Fremde Hose")

    response = client.post(
        "/api/outfits",
        json={"name": "Look", "item_ids": [foreign_item.id]},
        headers=_auth_headers(owner.id),
    )
    assert response.status_code == 404
