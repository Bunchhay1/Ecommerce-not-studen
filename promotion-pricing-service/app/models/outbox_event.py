from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.models.base import Base

def utcnow():
    return datetime.now(timezone.utc)

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    aggregate_type = Column(String(50), nullable=False, index=True)
    aggregate_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    payload = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING", index=True) # PENDING, PUBLISHED, FAILED
    retry_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
