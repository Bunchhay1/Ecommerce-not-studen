from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Numeric, DateTime
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(100), nullable=False, index=True)
    variant_id = Column(String(100), nullable=False, unique=True, index=True)
    currency = Column(String(10), nullable=False, default="USD")
    base_price = Column(Numeric(19, 4), nullable=False)
    sale_price = Column(Numeric(19, 4), nullable=True)
    status = Column(String(20), nullable=False, default="ACTIVE")
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_to = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
