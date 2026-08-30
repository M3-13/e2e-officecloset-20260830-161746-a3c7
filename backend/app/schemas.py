from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class Item(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    image_url: str | None
    created_at: datetime


class ItemCreate(BaseModel):
    name: str
    category: str


class ItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None


class Outfit(BaseModel):
    id: int
    name: str
    item_ids: list[int]
    created_at: datetime


class OutfitCreate(BaseModel):
    name: str
    item_ids: list[int]


class OutfitUpdate(BaseModel):
    name: str | None = None
    item_ids: list[int] | None = None


class OutfitDetail(BaseModel):
    id: int
    name: str
    items: list[Item]
    created_at: datetime
