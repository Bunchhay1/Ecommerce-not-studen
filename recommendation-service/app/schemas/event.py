import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.feedback_event import FeedbackType


class ProductCandidateUpsert(BaseModel):
    product_id: uuid.UUID
    name: str
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    price: Optional[float] = None
    brand: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = True
    is_in_stock: bool = True


class OrderItemEvent(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    unit_price: float = 0.0


class OrderPlacedEvent(BaseModel):
    order_id: uuid.UUID
    user_id: uuid.UUID
    items: List[OrderItemEvent]


class ReviewCreatedEvent(BaseModel):
    review_id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)


class FeedbackCreate(BaseModel):
    recommendation_id: str
    product_id: uuid.UUID
    feedback_type: FeedbackType
    position: int = 0
    strategy: Optional[str] = "PERSONALIZED"


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    recommendation_id: str
    product_id: uuid.UUID
    feedback_type: FeedbackType
    position: int
