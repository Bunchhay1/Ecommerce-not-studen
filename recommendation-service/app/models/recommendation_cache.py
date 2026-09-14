from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin


class RecommendationType:
    PERSONALIZED = "PERSONALIZED"
    SIMILAR = "SIMILAR"
    BOUGHT_TOGETHER = "BOUGHT_TOGETHER"
    TRENDING = "TRENDING"
    POPULAR = "POPULAR"
    RECENTLY_VIEWED = "RECENTLY_VIEWED"


class RecommendationCacheRecord(Base, UUIDMixin):
    __tablename__ = "recommendations"

    user_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    product_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    model_version: Mapped[str] = mapped_column(String(32), default="v1.0", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_rec_user_type_rank", "user_id", "recommendation_type", "rank"),
    )
