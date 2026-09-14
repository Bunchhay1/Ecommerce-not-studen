from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.pricing_service import PricingService
from app.schemas.pricing import (
    PricingCalculateRequest,
    PricingCalculateResponse,
    ProductPriceCreateDto,
    ProductPriceResponseDto,
)
from app.core.security import require_admin

router = APIRouter(prefix="", tags=["Pricing"])

@router.post("/pricing/calculate", response_model=PricingCalculateResponse)
async def calculate_pricing(
    request: PricingCalculateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = PricingService(db)
    return await service.calculate_pricing(request)

@router.get("/prices/{variant_id}", response_model=ProductPriceResponseDto)
async def get_price(
    variant_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = PricingService(db)
    return await service.get_price(variant_id)

@router.get("/prices", response_model=List[ProductPriceResponseDto])
async def list_prices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = PricingService(db)
    return await service.list_prices(skip, limit)

@router.post("/prices", response_model=ProductPriceResponseDto)
async def upsert_price(
    dto: ProductPriceCreateDto,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PricingService(db)
    return await service.upsert_price(dto)
