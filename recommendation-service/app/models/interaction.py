import enum
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import String, Float, Integer, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin


class InteractionType(str, enum.Enum):
    VIEW = "VIEW"
    SEARCH_CLICK = "SEARCH_CLICK"
    FAVORITE = "FAVORITE"
    ADD_TO_CART = "ADD_TO_CART"
    PURCHASE = "PURCHASE"
    RATING = "RATING"


class InteractionWeight:
    VIEW = 1.0
    SEARCH_CLICK = 2.0
    FAVORITE = 4.0
    ADD_TO_CART = 6.0
    PURCHASE = 10.0
    RATING = 5.0

    @classmethod
    def get_weight(cls, event_type: str) -> float:
        return getattr(cls, str(event_type).upper(), 1.0)

    def __getitem__(self, key: str) -> float:
        return self.get_weight(key)


# Module-level instance for dictionary/enum style access InteractionWeight['VIEW']
interaction_weight_map = {
    "VIEW": 1.0,
    "SEARCH_CLICK": 2.0,
    "FAVORITE": 4.0,
    "ADD_TO_CART": 6.0,
    "PURCHASE": 10.0,
    "RATING": 5.0,
}


class UserProductInteraction(Base, UUIDMixin):
    __tablename__ = "user_product_interactions"

    user_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    product_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    @property
    def interaction_type(self) -> str:
        return self.event_type

    __table_args__ = (
        Index("idx_user_product_time", "user_id", "product_id", "created_at"),
        Index("idx_product_event_weight", "product_id", "event_type", "created_at"),
    )
