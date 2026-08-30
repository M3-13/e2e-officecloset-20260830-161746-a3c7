from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


def _get_own_outfit(outfit_id: int, user: models.User, db: Session) -> models.Outfit:
    outfit = db.get(models.Outfit, outfit_id)
    if outfit is None or outfit.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    return outfit


def _resolve_items(
    item_ids: list[int], user: models.User, db: Session
) -> list[models.WardrobeItem]:
    items: list[models.WardrobeItem] = []
    for item_id in item_ids:
        item = db.get(models.WardrobeItem, item_id)
        if item is None or item.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
        items.append(item)
    return items


def _outfit_to_schema(outfit: models.Outfit) -> schemas.Outfit:
    return schemas.Outfit(
        id=outfit.id,
        name=outfit.name,
        item_ids=[item.id for item in outfit.items],
        created_at=outfit.created_at,
    )


def _outfit_to_detail(outfit: models.Outfit) -> schemas.OutfitDetail:
    return schemas.OutfitDetail(
        id=outfit.id,
        name=outfit.name,
        items=[schemas.Item.model_validate(item) for item in outfit.items],
        created_at=outfit.created_at,
    )


@router.get("", response_model=list[schemas.Outfit])
def list_outfits(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[schemas.Outfit]:
    outfits = db.query(models.Outfit).filter(models.Outfit.user_id == user.id).all()
    return [_outfit_to_schema(outfit) for outfit in outfits]


@router.post("", response_model=schemas.Outfit, status_code=status.HTTP_201_CREATED)
def create_outfit(
    payload: schemas.OutfitCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.Outfit:
    items = _resolve_items(payload.item_ids, user, db)
    outfit = models.Outfit(user_id=user.id, name=payload.name, items=items)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return _outfit_to_schema(outfit)


@router.get("/{outfit_id}", response_model=schemas.OutfitDetail)
def get_outfit(
    outfit_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.OutfitDetail:
    outfit = _get_own_outfit(outfit_id, user, db)
    return _outfit_to_detail(outfit)


@router.patch("/{outfit_id}", response_model=schemas.OutfitDetail)
def update_outfit(
    outfit_id: int,
    payload: schemas.OutfitUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.OutfitDetail:
    outfit = _get_own_outfit(outfit_id, user, db)
    if payload.name is not None:
        outfit.name = payload.name
    if payload.item_ids is not None:
        outfit.items = _resolve_items(payload.item_ids, user, db)
    db.commit()
    db.refresh(outfit)
    return _outfit_to_detail(outfit)


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    outfit = _get_own_outfit(outfit_id, user, db)
    db.delete(outfit)
    db.commit()
