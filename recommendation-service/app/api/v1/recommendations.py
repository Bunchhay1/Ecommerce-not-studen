import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.recommendation_service import RecommendationService
from app.schemas.recommendation import RecommendationResponse, RecommendationQuery
from app.core.security import get_optional_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/personalized", response_model=RecommendationResponse)
async def get_personalized_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    category_id: Optional[uuid.UUID] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    only_in_stock: bool = Query(default=True),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get personalized product recommendations based on user history or session.
    Falls back gracefully to trending/popular products for cold-start users.
    """
    user_id = uuid.UUID(current_user["sub"]) if current_user and "sub" in current_user else None
    service = RecommendationService(db)
    query = RecommendationQuery(
        limit=limit,
        offset=offset,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        only_in_stock=only_in_stock,
    )
    return await service.get_personalized_recommendations(
        user_id=user_id, session_id=x_session_id, query=query
    )


@router.get("/similar/{product_id}", response_model=RecommendationResponse)
async def get_similar_products(
    product_id: uuid.UUID,
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    category_id: Optional[uuid.UUID] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    only_in_stock: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    """
    Get products similar to the given product using TF-IDF content similarity and category fallback.
    """
    service = RecommendationService(db)
    query = RecommendationQuery(
        limit=limit,
        offset=offset,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        only_in_stock=only_in_stock,
        exclude_product_ids=[product_id],
    )
    return await service.get_similar_products(product_id=product_id, query=query)


@router.get("/bought-together/{product_id}", response_model=RecommendationResponse)
async def get_frequently_bought_together(
    product_id: uuid.UUID,
    limit: int = Query(default=5, ge=1, le=20),
    offset: int = Query(default=0, ge=0),
    only_in_stock: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    """
    Get products frequently purchased together with the given product based on co-occurrence mining.
    """
    service = RecommendationService(db)
    query = RecommendationQuery(
        limit=limit,
        offset=offset,
        only_in_stock=only_in_stock,
        exclude_product_ids=[product_id],
    )
    return await service.get_frequently_bought_together(product_id=product_id, query=query)


@router.get("/recently-viewed", response_model=RecommendationResponse)
async def get_recently_viewed(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    only_in_stock: bool = Query(default=True),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get items recently interacted with by the user or session.
    """
    user_id = uuid.UUID(current_user["sub"]) if current_user and "sub" in current_user else None
    service = RecommendationService(db)
    query = RecommendationQuery(limit=limit, offset=offset, only_in_stock=only_in_stock)
    return await service.get_recently_viewed(
        user_id=user_id, session_id=x_session_id, query=query
    )
