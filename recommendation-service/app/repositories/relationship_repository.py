import uuid
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product_relationship import ProductRelationship, RelationshipType


class RelationshipRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_relationships(
        self,
        product_id: uuid.UUID | str,
        relationship_type: str,
        limit: int = 10,
    ) -> List[ProductRelationship]:
        pid_str = str(product_id)
        stmt = (
            select(ProductRelationship)
            .where(
                and_(
                    ProductRelationship.product_id == pid_str,
                    ProductRelationship.relationship_type == relationship_type,
                )
            )
            .order_by(ProductRelationship.score.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def upsert_relationship(
        self,
        source_id: uuid.UUID | str,
        target_id: uuid.UUID | str,
        relationship_type: str,
        score: float,
        support_count: int = 1,
    ) -> ProductRelationship:
        src_str = str(source_id)
        tgt_str = str(target_id)
        stmt = select(ProductRelationship).where(
            and_(
                ProductRelationship.product_id == src_str,
                ProductRelationship.related_product_id == tgt_str,
                ProductRelationship.relationship_type == relationship_type,
            )
        )
        result = await self.db.execute(stmt)
        rel = result.scalar_one_or_none()

        if rel:
            rel.score = score
            rel.support_count = support_count
        else:
            rel = ProductRelationship(
                product_id=src_str,
                related_product_id=tgt_str,
                relationship_type=relationship_type,
                score=score,
                support_count=support_count,
            )
            self.db.add(rel)

        await self.db.flush()
        return rel

    async def batch_upsert_relationships(
        self,
        relationships: List[dict],
    ) -> None:
        for item in relationships:
            await self.upsert_relationship(
                source_id=item["source_id"],
                target_id=item["target_id"],
                relationship_type=item["relationship_type"],
                score=item["score"],
                support_count=item.get("support_count", 1),
            )
