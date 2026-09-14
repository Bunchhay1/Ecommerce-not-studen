from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class PromotionTarget(Base):
    __tablename__ = "promotion_targets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    promotion_id = Column(String(36), ForeignKey("promotions.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(50), nullable=False) # PRODUCT, VARIANT, CATEGORY, BRAND, ORDER, CUSTOMER, CUSTOMER_GROUP
    target_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    promotion = relationship("Promotion", back_populates="targets")
