from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.repositories.promotion_repository import PromotionRepository
from app.repositories.coupon_repository import CouponRepository
from app.repositories.usage_repository import UsageRepository
from app.schemas.promotion import PromotionResponseDto
from app.schemas.coupon import CouponResponseDto, PromotionUsageResponseDto
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/promotions", response_model=List[PromotionResponseDto])
async def admin_list_promotions(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    repo = PromotionRepository(db)
    return await repo.list_promotions(status=status, skip=skip, limit=limit)

@router.get("/coupons", response_model=List[CouponResponseDto])
async def admin_list_coupons(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    repo = CouponRepository(db)
    return await repo.list_coupons(status=status, skip=skip, limit=limit)

@router.get("/promotion-usage", response_model=List[PromotionUsageResponseDto])
async def admin_list_usage(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    repo = UsageRepository(db)
    return await repo.list_usages(skip=skip, limit=limit)
