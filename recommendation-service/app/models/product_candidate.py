from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, Boolean, Text, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class ProductCandidate(Base):
    __tablename__ = "product_candidates"

    product_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    category_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    brand_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    brand_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rating_count: Mapped[int] = mapped_column(default=0, nullable=False)
    popularity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    attributes: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    @property
    def brand(self) -> Optional[str]:
        return self.brand_name

    @brand.setter
    def brand(self, value: Optional[str]):
        self.brand_name = value

    @property
    def is_in_stock(self) -> bool:
        return self.is_available

    @is_in_stock.setter
    def is_in_stock(self, value: bool):
        self.is_available = value

    @property
    def avg_rating(self) -> float:
        return self.rating

    @avg_rating.setter
    def avg_rating(self, value: float):
        self.rating = value

    @property
    def review_count(self) -> int:
        return self.rating_count

    @review_count.setter
    def review_count(self, value: int):
        self.rating_count = value

    __table_args__ = (
        Index("idx_candidate_cat_avail", "category_id", "is_available"),
        Index("idx_candidate_brand_avail", "brand_id", "is_available"),
    )
