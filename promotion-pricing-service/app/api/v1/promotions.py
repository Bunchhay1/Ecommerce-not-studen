from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.promotion_service import PromotionService
from app.schemas.promotion import (
    PromotionCreateDto,
    PromotionUpdateDto,
    PromotionResponseDto,
)
from app.core.security import require_admin

router = APIRouter(prefix="/promotions", tags=["Promotions"])

@router.post("", response_model=PromotionResponseDto, status_code=status.HTTP_201_CREATED)
async def create_promotion(
    dto: PromotionCreateDto,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PromotionService(db)
    return await service.create_promotion(dto)

@router.get("/{id}", response_model=PromotionResponseDto)
async def get_promotion(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    service = PromotionService(db)
    return await service.get_promotion(id)

@router.get("", response_model=List[PromotionResponseDto])
async def list_promotions(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = PromotionService(db)
    return await service.list_promotions(status=status, skip=skip, limit=limit)

@router.patch("/{id}", response_model=PromotionResponseDto)
async def update_promotion(
    id: str,
    dto: PromotionUpdateDto,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PromotionService(db)
    return await service.update_promotion(id, dto)

@router.post("/{id}/activate", response_model=PromotionResponseDto)
async def activate_promotion(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PromotionService(db)
    return await service.activate_promotion(id)

@router.post("/{id}/pause", response_model=PromotionResponseDto)
async def pause_promotion(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PromotionService(db)
    return await service.pause_promotion(id)

@router.post("/{id}/cancel", response_model=PromotionResponseDto)
async def cancel_promotion(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin = Depends(require_admin),
):
    service = PromotionService(db)
    return await service.cancel_promotion(id)
