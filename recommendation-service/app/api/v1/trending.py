import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.recommendation_service import RecommendationService
from app.schemas.recommendation import RecommendationResponse, RecommendationQuery

router = APIRouter(prefix="/recommendations", tags=["Trending"])


@router.get("/trending", response_model=RecommendationResponse)
async def get_trending_products(
    hours: int = Query(default=24, ge=1, le=168, description="Trending window in hours (up to 7 days)"),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    category_id: Optional[uuid.UUID] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    only_in_stock: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    """
    Get top trending products based on interaction velocity and popularity fallback.
    """
    service = RecommendationService(db)
    query = RecommendationQuery(
        limit=limit,
        offset=offset,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        only_in_stock=only_in_stock,
    )
    return await service.get_trending_products(query=query, hours=hours)
