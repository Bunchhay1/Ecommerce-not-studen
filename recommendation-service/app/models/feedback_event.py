import uuid
import enum
from typing import Optional
from sqlalchemy import String, Enum, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class FeedbackType(str, enum.Enum):
    SHOWN = "SHOWN"
    CLICKED = "CLICKED"
    DISMISSED = "DISMISSED"
    CONVERTED = "CONVERTED"


class RecommendationFeedback(Base, UUIDMixin, TimestampMixin):
    """
    Logs customer impressions and interactions with served recommendations.
    Used for A/B testing evaluation and online/offline CTR metrics.
    """
    __tablename__ = "recommendation_feedback"

    recommendation_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    strategy: Mapped[str] = mapped_column(String(50), nullable=False)
    feedback_type: Mapped[FeedbackType] = mapped_column(
        Enum(FeedbackType, name="feedback_type_enum"),
        nullable=False,
        default=FeedbackType.SHOWN
    )
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Rank position (0-indexed)

    __table_args__ = (
        Index("idx_feedback_rec_user", "recommendation_id", "user_id"),
        Index("idx_feedback_product_type", "product_id", "feedback_type"),
    )
