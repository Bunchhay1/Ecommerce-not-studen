import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationItem,
    RecommendationQuery,
)
from app.schemas.interaction import InteractionCreate, InteractionResponse
from app.schemas.event import FeedbackCreate, FeedbackResponse
from app.models.interaction import InteractionType
from app.repositories.interaction_repository import InteractionRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.feedback_repository import FeedbackRepository
from app.services.similarity_service import SimilarityService
from app.services.bought_together_service import BoughtTogetherService
from app.services.trending_service import TrendingService
from app.services.personalization_service import PersonalizationService
from app.services.ranking_service import RankingService
from app.cache.redis_cache import cache


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.similarity_service = SimilarityService(db)
        self.bought_together_service = BoughtTogetherService(db)
        self.trending_service = TrendingService(db)
        self.personalization_service = PersonalizationService(db)
        self.interaction_repo = InteractionRepository(db)
        self.candidate_repo = CandidateRepository(db)
        self.feedback_repo = FeedbackRepository(db)

    async def get_personalized_recommendations(
        self,
        user_id: Optional[uuid.UUID],
        session_id: Optional[str],
        query: RecommendationQuery,
    ) -> RecommendationResponse:
        items = await self.personalization_service.get_personalized(
            user_id=user_id, session_id=session_id, query=query
        )
        return RecommendationResponse(
            recommendation_id=f"rec_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            session_id=session_id,
            strategy="PERSONALIZED",
            algorithm_version="v1.0",
            total=len(items),
            items=items,
        )

    async def get_similar_products(
        self, product_id: uuid.UUID, query: RecommendationQuery
    ) -> RecommendationResponse:
        items = await self.similarity_service.get_similar(product_id=product_id, query=query)
        return RecommendationResponse(
            recommendation_id=f"rec_{uuid.uuid4().hex[:12]}",
            strategy="SIMILAR",
            algorithm_version="v1.0",
            total=len(items),
            items=items,
        )

    async def get_frequently_bought_together(
        self, product_id: uuid.UUID, query: RecommendationQuery
    ) -> RecommendationResponse:
        items = await self.bought_together_service.get_bought_together(
            product_id=product_id, query=query
        )
        return RecommendationResponse(
            recommendation_id=f"rec_{uuid.uuid4().hex[:12]}",
            strategy="BOUGHT_TOGETHER",
            algorithm_version="v1.0",
            total=len(items),
            items=items,
        )

    async def get_trending_products(
        self, query: RecommendationQuery, hours: int = 24
    ) -> RecommendationResponse:
        items = await self.trending_service.get_trending(query=query, hours=hours)
        return RecommendationResponse(
            recommendation_id=f"rec_{uuid.uuid4().hex[:12]}",
            strategy="TRENDING",
            algorithm_version="v1.0",
            total=len(items),
            items=items,
        )

    async def get_recently_viewed(
        self,
        user_id: Optional[uuid.UUID],
        session_id: Optional[str],
        query: RecommendationQuery,
    ) -> RecommendationResponse:
        product_ids = await self.interaction_repo.get_user_interacted_product_ids(
            user_id=user_id, session_id=session_id, limit=query.limit * 2
        )
        candidates = await self.candidate_repo.get_by_ids(product_ids)
        prod_map = {str(p.product_id): p for p in candidates}

        items: List[RecommendationItem] = []
        for pid in product_ids:
            p = prod_map.get(str(pid))
            if not p:
                continue
            cat_id = None
            if p.category_id:
                try:
                    cat_id = uuid.UUID(str(p.category_id))
                except Exception:
                    pass
            item = RecommendationItem(
                product_id=uuid.UUID(str(p.product_id)),
                name=p.name,
                category_id=cat_id,
                category_name=p.category_name,
                price=p.price,
                score=1.0,
                reason="Recently viewed by you",
                algorithm="interaction_history",
                is_in_stock=p.is_in_stock,
            )
            items.append(item)

        ranked = RankingService.filter_and_rank(items, query)
        return RecommendationResponse(
            recommendation_id=f"rec_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            session_id=session_id,
            strategy="RECENTLY_VIEWED",
            algorithm_version="v1.0",
            total=len(ranked),
            items=ranked,
        )

    async def record_interaction(
        self, interaction_data: InteractionCreate
    ) -> InteractionResponse:
        interaction = await self.interaction_repo.create_interaction(interaction_data)
        # Invalidate user cache on interaction
        if interaction_data.user_id:
            await cache.delete_keys(f"rec:user:{interaction_data.user_id}:*")
        elif interaction_data.session_id:
            await cache.delete_keys(f"rec:user:anon_{interaction_data.session_id}:*")

        return InteractionResponse(
            id=uuid.UUID(interaction.id),
            user_id=uuid.UUID(interaction.user_id) if interaction.user_id else None,
            session_id=interaction.session_id,
            product_id=uuid.UUID(interaction.product_id),
            interaction_type=InteractionType(interaction.event_type),
            weight=interaction.weight,
            duration_seconds=interaction.duration_seconds,
            created_at=interaction.created_at,
        )

    async def record_feedback(
        self,
        feedback_data: FeedbackCreate,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
    ) -> FeedbackResponse:
        feedback = await self.feedback_repo.create_feedback(
            feedback=feedback_data, user_id=user_id, session_id=session_id
        )
        return FeedbackResponse(
            id=uuid.UUID(feedback.id),
            recommendation_id=feedback.recommendation_id,
            product_id=feedback.product_id if isinstance(feedback.product_id, uuid.UUID) else uuid.UUID(str(feedback.product_id)),
            feedback_type=feedback.feedback_type,
            position=feedback.position,
        )
