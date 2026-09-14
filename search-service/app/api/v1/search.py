from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.common import ApiResponse
from app.schemas.search import SearchParams, SearchResponse, SortOption
from app.services.search_service import SearchService, get_search_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=ApiResponse[SearchResponse])
async def search_products(
    q: Optional[str] = Query(None, description="Search keyword/term"),
    category_id: Optional[str] = Query(None, description="Filter by Category ID"),
    brand_id: Optional[str] = Query(None, description="Filter by Brand ID"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    status: Optional[str] = Query("ACTIVE", description="Product status filter"),
    sort: SortOption = Query(SortOption.RELEVANCE, description="Sort option"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    service: SearchService = Depends(get_search_service)
):
    """
    Full-text search, filter, and paginate products.
    """
    params = SearchParams(
        q=q,
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        status=status,
        sort=sort,
        page=page,
        size=size
    )
    result = await service.search(params)
    return ApiResponse(
        success=True,
        message="Search executed successfully",
        data=result
    )
