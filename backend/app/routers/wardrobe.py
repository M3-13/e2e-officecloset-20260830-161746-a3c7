from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])


def _get_owned_item(db: Session, user: models.User, item_id: int) -> models.WardrobeItem:
    item = db.get(models.WardrobeItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.get("", response_model=list[schemas.Item])
def list_items(
    category: str | None = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.WardrobeItem]:
    query = db.query(models.WardrobeItem).filter(models.WardrobeItem.user_id == user.id)
    if category is not None:
        query = query.filter(models.WardrobeItem.category == category)
    return query.all()


@router.post("", response_model=schemas.Item, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: schemas.ItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.WardrobeItem:
    item = models.WardrobeItem(user_id=user.id, name=payload.name, category=payload.category)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=schemas.Item)
def update_item(
    item_id: int,
    payload: schemas.ItemUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.WardrobeItem:
    item = _get_owned_item(db, user, item_id)
    if payload.name is not None:
        item.name = payload.name
    if payload.category is not None:
        item.category = payload.category
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = _get_owned_item(db, user, item_id)
    db.delete(item)
    db.commit()
