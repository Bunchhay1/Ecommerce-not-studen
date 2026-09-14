from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Numeric, DateTime
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class PromotionUsage(Base):
    __tablename__ = "promotion_usages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    promotion_id = Column(String(36), nullable=False, index=True)
    coupon_id = Column(String(36), nullable=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    order_id = Column(String(100), nullable=True, index=True)
    discount_amount = Column(Numeric(19, 4), nullable=False)
    used_at = Column(DateTime(timezone=True), default=utcnow)
