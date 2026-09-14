from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=True, unique=True, index=True)
    type = Column(String(50), nullable=False) # PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y, FREE_SHIPPING, CATEGORY_DISCOUNT, PRODUCT_DISCOUNT, ORDER_DISCOUNT
    status = Column(String(20), nullable=False, default="DRAFT") # DRAFT, SCHEDULED, ACTIVE, PAUSED, EXPIRED, CANCELLED
    priority = Column(Integer, nullable=False, default=0)
    discount_value = Column(Numeric(19, 4), nullable=False, default=0)
    buy_quantity = Column(Integer, nullable=True) # for BUY_X_GET_Y
    get_quantity = Column(Integer, nullable=True) # for BUY_X_GET_Y
    description = Column(Text, nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=True)
    end_at = Column(DateTime(timezone=True), nullable=True)
    usage_limit = Column(Integer, nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    per_user_limit = Column(Integer, nullable=False, default=1)
    min_order_amount = Column(Numeric(19, 4), nullable=True)
    max_discount_amount = Column(Numeric(19, 4), nullable=True)
    is_stackable = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    targets = relationship("PromotionTarget", back_populates="promotion", cascade="all, delete-orphan", lazy="selectin")
    rules = relationship("PromotionRule", back_populates="promotion", cascade="all, delete-orphan", lazy="selectin")
    coupons = relationship("Coupon", back_populates="promotion", cascade="all, delete-orphan", lazy="selectin")
