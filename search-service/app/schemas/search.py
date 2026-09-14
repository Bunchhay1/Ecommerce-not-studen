from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class SortOption(str, Enum):
    RELEVANCE = "relevance"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NEWEST = "newest"


class SearchParams(BaseModel):
    q: Optional[str] = Field(default=None, description="Search keyword/term")
    category_id: Optional[str] = Field(default=None, description="Category filter")
    brand_id: Optional[str] = Field(default=None, description="Brand filter")
    min_price: Optional[float] = Field(default=None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(default=None, ge=0, description="Maximum price filter")
    status: Optional[str] = Field(default="ACTIVE", description="Product status filter")
    sort: SortOption = Field(default=SortOption.RELEVANCE, description="Sort order")
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")


class FacetBucket(BaseModel):
    key: str
    count: int
    label: Optional[str] = None


class SearchFacets(BaseModel):
    categories: List[FacetBucket] = Field(default_factory=list)
    brands: List[FacetBucket] = Field(default_factory=list)
    price_stats: Optional[Dict[str, float]] = None


class SearchResultItem(BaseModel):
    product_id: str
    name: str
    slug: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    price: Optional[float] = 0.0
    status: str
    primary_image_url: Optional[str] = None
    attributes: Dict[str, str] = Field(default_factory=dict)
    score: Optional[float] = None


class SearchResponse(BaseModel):
    query: Optional[str] = None
    page: int
    size: int
    total: int
    total_pages: int
    items: List[SearchResultItem]
    facets: Optional[SearchFacets] = None
    took_ms: Optional[int] = None


class AutocompleteResponse(BaseModel):
    query: str
    suggestions: List[str]


class SearchSuggestionsResponse(BaseModel):
    query: str
    suggestions: List[str]
    popular_categories: List[Dict[str, str]] = Field(default_factory=list)
    popular_brands: List[Dict[str, str]] = Field(default_factory=list)
