from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    promotion_id = Column(String(36), ForeignKey("promotions.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="ACTIVE") # ACTIVE, INACTIVE, EXPIRED
    usage_limit = Column(Integer, nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    per_user_limit = Column(Integer, nullable=False, default=1)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    promotion = relationship("Promotion", back_populates="coupons")
