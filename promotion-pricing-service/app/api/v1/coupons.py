from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.coupon_service import CouponService
from app.schemas.coupon import (
    CouponCreateDto,
    CouponResponseDto,
    CouponValidateRequest,
    CouponValidateResponse,
    CouponRecordUsageRequest,
    PromotionUsageResponseDto,
)
from app.core.security import require_admin
from app.core.exceptions import CouponNotFoundException

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.post("", response_model=CouponResponseDto, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    dto: CouponCreateDto,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = CouponService(db)
    return await service.create_coupon(dto)

@router.get("/{id}", response_model=CouponResponseDto)
async def get_coupon(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    service = CouponService(db)
    coupon = await service.coupon_repo.get_by_id(id)
    if not coupon:
        raise CouponNotFoundException(id)
    return coupon

@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    request: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CouponService(db)
    # Approximate subtotal calculation from items (using dummy minimum or lookup if passed)
    # The Cart/Order usually calls /pricing/calculate, but /coupons/validate gives instant UI feedback
    cart_subtotal = Decimal("100.00") # validation baseline
    valid, discount, coupon, msg, promo = await service.validate_coupon(
        code=request.code,
        user_id=request.user_id,
        cart_subtotal=cart_subtotal,
        raise_on_invalid=False,
    )
    return CouponValidateResponse(
        valid=valid,
        code=request.code.upper(),
        discount=discount,
        currency="USD",
        promotionId=promo.id if promo else (coupon.promotion_id if coupon else None),
        message=msg if not valid else "Coupon is valid",
    )

@router.post("/{id}/activate", response_model=CouponResponseDto)
async def activate_coupon(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = CouponService(db)
    coupon = await service.coupon_repo.get_by_id(id)
    if not coupon:
        raise CouponNotFoundException(id)
    coupon.status = "ACTIVE"
    return await service.coupon_repo.save(coupon)

@router.post("/{id}/deactivate", response_model=CouponResponseDto)
async def deactivate_coupon(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = CouponService(db)
    coupon = await service.coupon_repo.get_by_id(id)
    if not coupon:
        raise CouponNotFoundException(id)
    coupon.status = "INACTIVE"
    return await service.coupon_repo.save(coupon)

@router.post("/record-usage", response_model=PromotionUsageResponseDto)
async def record_usage(
    request: CouponRecordUsageRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CouponService(db)
    return await service.record_usage(
        code=request.code,
        user_id=request.user_id,
        discount_amount=request.discount_amount,
        order_id=request.order_id,
    )
