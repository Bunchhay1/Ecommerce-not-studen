from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.product_price import ProductPrice
from app.schemas.pricing import ProductPriceCreateDto

class PriceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_variant_id(self, variant_id: str) -> Optional[ProductPrice]:
        result = await self.db.execute(select(ProductPrice).where(ProductPrice.variant_id == variant_id))
        return result.scalars().first()

    async def get_by_variant_ids(self, variant_ids: List[str]) -> Dict[str, ProductPrice]:
        result = await self.db.execute(select(ProductPrice).where(ProductPrice.variant_id.in_(variant_ids)))
        prices = result.scalars().all()
        return {p.variant_id: p for p in prices}

    async def list_prices(self, skip: int = 0, limit: int = 100) -> List[ProductPrice]:
        result = await self.db.execute(select(ProductPrice).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def upsert_price(self, dto: ProductPriceCreateDto) -> ProductPrice:
        existing = await self.get_by_variant_id(dto.variant_id)
        if existing:
            existing.product_id = dto.product_id
            existing.currency = dto.currency
            existing.base_price = dto.base_price
            existing.sale_price = dto.sale_price
            existing.status = dto.status
            existing.effective_from = dto.effective_from
            existing.effective_to = dto.effective_to
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            new_price = ProductPrice(
                product_id=dto.product_id,
                variant_id=dto.variant_id,
                currency=dto.currency,
                base_price=dto.base_price,
                sale_price=dto.sale_price,
                status=dto.status,
                effective_from=dto.effective_from,
                effective_to=dto.effective_to,
            )
            self.db.add(new_price)
            await self.db.commit()
            await self.db.refresh(new_price)
            return new_price
