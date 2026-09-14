from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.promotion import Promotion
from app.models.promotion_target import PromotionTarget
from app.models.promotion_rule import PromotionRule

class PromotionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, promotion_id: str) -> Optional[Promotion]:
        stmt = (
            select(Promotion)
            .where(Promotion.id == promotion_id)
            .options(selectinload(Promotion.targets), selectinload(Promotion.rules), selectinload(Promotion.coupons))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_code(self, code: str) -> Optional[Promotion]:
        stmt = (
            select(Promotion)
            .where(Promotion.code == code)
            .options(selectinload(Promotion.targets), selectinload(Promotion.rules), selectinload(Promotion.coupons))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_active_promotions(self) -> List[Promotion]:
        stmt = (
            select(Promotion)
            .where(Promotion.status == "ACTIVE")
            .order_by(Promotion.priority.desc())
            .options(selectinload(Promotion.targets), selectinload(Promotion.rules))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_promotions(self, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Promotion]:
        query = select(Promotion).options(selectinload(Promotion.targets), selectinload(Promotion.rules))
        if status:
            query = query.where(Promotion.status == status)
        query = query.order_by(Promotion.priority.desc(), Promotion.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, promo: Promotion) -> Promotion:
        self.db.add(promo)
        await self.db.commit()
        await self.db.refresh(promo)
        return promo

    async def save(self, promo: Promotion) -> Promotion:
        await self.db.commit()
        await self.db.refresh(promo)
        return promo
