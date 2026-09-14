import uuid
from typing import Optional, List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product_candidate import ProductCandidate
from app.schemas.event import ProductCandidateUpsert


class CandidateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: uuid.UUID | str) -> Optional[ProductCandidate]:
        pid_str = str(product_id)
        result = await self.db.execute(
            select(ProductCandidate).where(ProductCandidate.product_id == pid_str)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, product_ids: List[uuid.UUID | str]) -> List[ProductCandidate]:
        if not product_ids:
            return []
        pids = [str(p) for p in product_ids]
        result = await self.db.execute(
            select(ProductCandidate).where(ProductCandidate.product_id.in_(pids))
        )
        return list(result.scalars().all())

    async def get_all_active(
        self,
        category_id: Optional[uuid.UUID | str] = None,
        limit: int = 1000,
        only_in_stock: bool = False,
    ) -> List[ProductCandidate]:
        stmt = select(ProductCandidate).where(ProductCandidate.is_active == True)  # noqa: E712
        if category_id:
            stmt = stmt.where(ProductCandidate.category_id == str(category_id))
        if only_in_stock:
            stmt = stmt.where(ProductCandidate.is_available == True)  # noqa: E712
        stmt = stmt.limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def upsert_candidate(self, data: ProductCandidateUpsert) -> ProductCandidate:
        candidate = await self.get_by_id(data.product_id)
        if candidate:
            candidate.name = data.name
            if data.description is not None:
                candidate.description = data.description
            if data.category_id is not None:
                candidate.category_id = str(data.category_id)
            if data.category_name is not None:
                candidate.category_name = data.category_name
            if data.price is not None:
                candidate.price = data.price
            if data.brand is not None:
                candidate.brand_name = data.brand
            if data.tags is not None:
                candidate.tags = data.tags
            if data.attributes is not None:
                candidate.attributes = data.attributes
            candidate.is_active = data.is_active
            candidate.is_available = data.is_in_stock
        else:
            candidate = ProductCandidate(
                product_id=str(data.product_id),
                name=data.name,
                description=data.description,
                category_id=str(data.category_id) if data.category_id else None,
                category_name=data.category_name,
                price=data.price or 0.0,
                brand_name=data.brand,
                tags=data.tags or [],
                attributes=data.attributes or {},
                is_active=data.is_active,
                is_available=data.is_in_stock,
            )
            self.db.add(candidate)
        await self.db.flush()
        return candidate

    async def update_stock(self, product_id: uuid.UUID | str, is_in_stock: bool) -> None:
        await self.db.execute(
            update(ProductCandidate)
            .where(ProductCandidate.product_id == str(product_id))
            .values(is_available=is_in_stock)
        )
        await self.db.flush()

    async def update_rating(
        self, product_id: uuid.UUID | str, new_rating: float, increment_count: bool = True
    ) -> None:
        candidate = await self.get_by_id(product_id)
        if candidate:
            if increment_count:
                total_points = (candidate.rating * candidate.rating_count) + new_rating
                candidate.rating_count += 1
                candidate.rating = round(total_points / candidate.rating_count, 2)
            else:
                candidate.rating = new_rating
            await self.db.flush()

    async def get_top_popular(
        self,
        limit: int = 10,
        category_id: Optional[uuid.UUID | str] = None,
        only_in_stock: bool = True,
    ) -> List[ProductCandidate]:
        stmt = select(ProductCandidate).where(ProductCandidate.is_active == True)  # noqa: E712
        if category_id:
            stmt = stmt.where(ProductCandidate.category_id == str(category_id))
        if only_in_stock:
            stmt = stmt.where(ProductCandidate.is_available == True)  # noqa: E712

        # Order by actual table columns: rating, rating_count, popularity_score
        stmt = stmt.order_by(
            ProductCandidate.rating.desc(),
            ProductCandidate.rating_count.desc(),
            ProductCandidate.popularity_score.desc(),
        ).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
