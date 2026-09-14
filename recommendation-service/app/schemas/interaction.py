import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.interaction import InteractionType


class InteractionCreate(BaseModel):
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = Field(None, max_length=100)
    product_id: uuid.UUID
    interaction_type: InteractionType = InteractionType.VIEW
    duration_seconds: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class InteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    product_id: uuid.UUID
    interaction_type: InteractionType
    weight: float
    duration_seconds: Optional[int] = None
    created_at: datetime
