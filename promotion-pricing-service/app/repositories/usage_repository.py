from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.promotion_usage import PromotionUsage

class UsageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_coupon_usage_count(self, coupon_id: str, user_id: str) -> int:
        stmt = (
            select(func.count(PromotionUsage.id))
            .where(PromotionUsage.coupon_id == coupon_id, PromotionUsage.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def get_user_promotion_usage_count(self, promotion_id: str, user_id: str) -> int:
        stmt = (
            select(func.count(PromotionUsage.id))
            .where(PromotionUsage.promotion_id == promotion_id, PromotionUsage.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def record_usage(
        self,
        promotion_id: str,
        user_id: str,
        discount_amount: Decimal,
        coupon_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> PromotionUsage:
        usage = PromotionUsage(
            promotion_id=promotion_id,
            coupon_id=coupon_id,
            user_id=user_id,
            order_id=order_id,
            discount_amount=discount_amount,
        )
        self.db.add(usage)
        await self.db.commit()
        await self.db.refresh(usage)
        return usage

    async def list_usages(self, skip: int = 0, limit: int = 100) -> List[PromotionUsage]:
        stmt = select(PromotionUsage).order_by(PromotionUsage.used_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
