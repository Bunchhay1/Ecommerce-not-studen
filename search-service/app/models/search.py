import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class SearchSynonym(Base):
    __tablename__ = "search_synonyms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    term = Column(String(100), nullable=False, index=True)
    synonym = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SearchQueryLog(Base):
    __tablename__ = "search_query_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query = Column(String(255), nullable=False, index=True)
    results_count = Column(String(20), nullable=False, default="0")
    execution_time_ms = Column(String(20), nullable=False, default="0")
    user_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
