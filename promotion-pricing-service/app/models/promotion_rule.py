from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class PromotionRule(Base):
    __tablename__ = "promotion_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    promotion_id = Column(String(36), ForeignKey("promotions.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type = Column(String(50), nullable=False) # MIN_ORDER_AMOUNT, CATEGORY, QUANTITY, CUSTOMER_TIER
    operator = Column(String(30), nullable=False) # EQUALS, NOT_EQUALS, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, IN, NOT_IN
    value = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    promotion = relationship("Promotion", back_populates="rules")
