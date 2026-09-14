import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class RecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: uuid.UUID
    name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    price: Optional[float] = None
    score: float = Field(..., description="Relevance score from 0.0 to 1.0")
    reason: Optional[str] = Field(None, description="Human-readable reason e.g. 'Frequently bought with iPhone'")
    algorithm: Optional[str] = Field("heuristic", description="Algorithm source e.g. 'tfidf', 'cooccurrence'")
    image_url: Optional[str] = None
    is_in_stock: bool = True


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recommendation_id: str = Field(..., description="Unique ID for this recommendation batch for feedback tracking")
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    strategy: str = Field(..., description="PERSONALIZED, SIMILAR, BOUGHT_TOGETHER, TRENDING, RECENTLY_VIEWED")
    algorithm_version: str = "v1.0"
    total: int
    items: List[RecommendationItem] = Field(default_factory=list)


class RecommendationQuery(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)
    offset: int = Field(default=0, ge=0)
    category_id: Optional[uuid.UUID] = None
    exclude_product_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    only_in_stock: bool = True
