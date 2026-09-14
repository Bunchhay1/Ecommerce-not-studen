import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.interaction import UserProductInteraction, InteractionType, InteractionWeight
from app.schemas.interaction import InteractionCreate


class InteractionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_interaction(
        self, interaction_data: InteractionCreate, weight: Optional[float] = None
    ) -> UserProductInteraction:
        if weight is None:
            weight = InteractionWeight.get_weight(interaction_data.interaction_type.value)

        interaction = UserProductInteraction(
            user_id=str(interaction_data.user_id) if interaction_data.user_id else None,
            session_id=interaction_data.session_id,
            product_id=str(interaction_data.product_id),
            event_type=interaction_data.interaction_type.value,
            weight=weight,
            duration_seconds=interaction_data.duration_seconds,
            metadata_=interaction_data.metadata or {},
        )
        self.db.add(interaction)
        await self.db.flush()
        return interaction

    async def get_user_interactions(
        self,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[UserProductInteraction]:
        if not user_id and not session_id:
            return []

        stmt = select(UserProductInteraction)
        if user_id:
            stmt = stmt.where(UserProductInteraction.user_id == str(user_id))
        elif session_id:
            stmt = stmt.where(UserProductInteraction.session_id == session_id)

        stmt = stmt.order_by(UserProductInteraction.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_user_interacted_product_ids(
        self,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[uuid.UUID]:
        interactions = await self.get_user_interactions(user_id=user_id, session_id=session_id, limit=limit)
        seen = set()
        product_ids = []
        for item in interactions:
            pid = uuid.UUID(item.product_id) if isinstance(item.product_id, str) else item.product_id
            if pid not in seen:
                seen.add(pid)
                product_ids.append(pid)
        return product_ids

    async def get_trending_product_counts(
        self, hours: int = 24, limit: int = 20
    ) -> List[Tuple[uuid.UUID, float]]:
        """
        Returns list of (product_id, aggregated_weighted_score) over the past `hours`.
        Calculates trending score based on interaction weights.
        """
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        stmt = (
            select(
                UserProductInteraction.product_id,
                func.sum(UserProductInteraction.weight).label("total_weight"),
            )
            .where(UserProductInteraction.created_at >= since)
            .group_by(UserProductInteraction.product_id)
            .order_by(desc("total_weight"))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        results = []
        for row in result.all():
            pid = uuid.UUID(row[0]) if isinstance(row[0], str) else row[0]
            results.append((pid, float(row[1])))
        return results

    async def get_recent_interactions_for_training(
        self, days: int = 30, limit: int = 20000
    ) -> List[UserProductInteraction]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = (
            select(UserProductInteraction)
            .where(UserProductInteraction.created_at >= since)
            .order_by(UserProductInteraction.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
