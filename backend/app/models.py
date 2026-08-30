from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


outfit_items = Table(
    "outfit_items",
    Base.metadata,
    Column(
        "outfit_id",
        Integer,
        ForeignKey("outfits.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "item_id",
        Integer,
        ForeignKey("wardrobe_items.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    items = relationship("WardrobeItem", back_populates="owner", cascade="all, delete-orphan")
    outfits = relationship("Outfit", back_populates="owner", cascade="all, delete-orphan")


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    owner = relationship("User", back_populates="items")
    outfits = relationship("Outfit", secondary=outfit_items, back_populates="items")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    owner = relationship("User", back_populates="outfits")
    items = relationship("WardrobeItem", secondary=outfit_items, back_populates="outfits")
