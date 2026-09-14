from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from app.models.coupon import Coupon

class CouponRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_code(self, code: str) -> Optional[Coupon]:
        stmt = select(Coupon).where(Coupon.code == code.upper())
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, coupon_id: str) -> Optional[Coupon]:
        stmt = select(Coupon).where(Coupon.id == coupon_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_coupons(self, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Coupon]:
        query = select(Coupon)
        if status:
            query = query.where(Coupon.status == status)
        query = query.order_by(Coupon.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def save(self, coupon: Coupon) -> Coupon:
        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def increment_usage_atomic(self, coupon_id: str) -> bool:
        """
        Atomic update to prevent race conditions when concurrent users check out.
        Returns True if increment was successful, False if usage limit was exceeded.
        """
        stmt = (
            update(Coupon)
            .where(
                Coupon.id == coupon_id,
                Coupon.status == "ACTIVE",
                or_(Coupon.usage_limit.is_(None), Coupon.usage_count < Coupon.usage_limit),
            )
            .values(usage_count=Coupon.usage_count + 1)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
