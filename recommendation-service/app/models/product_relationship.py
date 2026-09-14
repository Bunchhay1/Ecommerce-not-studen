from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin


class RelationshipType:
    SIMILAR = "SIMILAR"
    BOUGHT_TOGETHER = "BOUGHT_TOGETHER"
    VIEWED_TOGETHER = "VIEWED_TOGETHER"
    ALSO_LIKED = "ALSO_LIKED"


class ProductRelationship(Base, UUIDMixin):
    __tablename__ = "product_relationships"

    product_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    related_product_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    support_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    @property
    def source_product_id(self) -> str:
        return self.product_id

    @source_product_id.setter
    def source_product_id(self, val: str):
        self.product_id = val

    @property
    def target_product_id(self) -> str:
        return self.related_product_id

    @target_product_id.setter
    def target_product_id(self, val: str):
        self.related_product_id = val

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "related_product_id",
            "relationship_type",
            name="uq_product_relationship",
        ),
        Index("idx_rel_lookup", "product_id", "relationship_type", "score"),
    )
