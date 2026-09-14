from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProductVariantDoc(BaseModel):
    id: str
    sku: str
    status: str = "ACTIVE"
    attributes: Dict[str, str] = Field(default_factory=dict)


class ProductImageDoc(BaseModel):
    id: Optional[str] = None
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False


class ProductIndexDocument(BaseModel):
    product_id: str
    name: str
    slug: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    brand_slug: Optional[str] = None
    price: Optional[float] = 0.0
    status: str = "ACTIVE"
    attributes: Dict[str, str] = Field(default_factory=dict)
    images: List[ProductImageDoc] = Field(default_factory=list)
    variants: List[ProductVariantDoc] = Field(default_factory=list)
    suggest: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
