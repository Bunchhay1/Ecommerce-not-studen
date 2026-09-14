import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class ModelMetadata(Base, UUIDMixin, TimestampMixin):
    """
    Tracks trained ML model versions, training time, parameters, and active status.
    """
    __tablename__ = "model_metadata"

    model_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'TFIDF', 'COOCCURRENCE', 'COLLABORATIVE'
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
