import uuid
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.recommendation import RecommendationItem, RecommendationQuery
from app.services.similarity_service import SimilarityService
from app.services.trending_service import TrendingService
from app.services.ranking_service import RankingService
from app.cache.redis_cache import cache


class PersonalizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.interaction_repo = InteractionRepository(db)
        self.similarity_service = SimilarityService(db)
        self.trending_service = TrendingService(db)

    async def get_personalized(
        self,
        user_id: Optional[uuid.UUID | str],
        session_id: Optional[str],
        query: RecommendationQuery,
    ) -> List[RecommendationItem]:
        user_key = str(user_id) if user_id else f"anon_{session_id}"
        cache_key = f"rec:user:{user_key}:PERSONALIZED"
        cached = await cache.get_json(cache_key)
        if cached:
            items = [RecommendationItem(**item) for item in cached]
            return RankingService.filter_and_rank(items, query)

        user_uuid = uuid.UUID(str(user_id)) if user_id else None
        interactions = await self.interaction_repo.get_user_interactions(
            user_id=user_uuid, session_id=session_id, limit=20
        )

        if not interactions:
            trending_items = await self.trending_service.get_trending(query)
            for item in trending_items:
                item.reason = "Popular items you might like"
                item.algorithm = "cold_start_trending"
            return trending_items

        interacted_product_ids = set()
        product_weights: Dict[str, float] = {}

        for inter in interactions:
            pid_str = str(inter.product_id)
            interacted_product_ids.add(pid_str)
            product_weights[pid_str] = product_weights.get(pid_str, 0.0) + inter.weight

        candidate_scores: Dict[str, float] = {}
        for prod_id_str, weight in list(product_weights.items())[:5]:
            similars = await self.similarity_service.get_similar(
                prod_id_str,
                RecommendationQuery(
                    limit=10,
                    only_in_stock=query.only_in_stock,
                    exclude_product_ids=[uuid.UUID(p) for p in interacted_product_ids if len(p) == 36],
                ),
            )
            for sim in similars:
                target_str = str(sim.product_id)
                combined = sim.score * (weight / 10.0)
                candidate_scores[target_str] = max(
                    candidate_scores.get(target_str, 0.0), round(combined, 4)
                )

        for seen_id in interacted_product_ids:
            candidate_scores.pop(seen_id, None)

        if not candidate_scores:
            return await self.trending_service.get_trending(query)

        products = await self.candidate_repo.get_by_ids(list(candidate_scores.keys()))
        prod_map = {str(p.product_id): p for p in products}

        results: List[RecommendationItem] = []
        for target_id_str, score in candidate_scores.items():
            p = prod_map.get(target_id_str)
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
                score=min(1.0, score),
                reason="Recommended based on your browsing and purchase preferences",
                algorithm="personalized_hybrid",
                is_in_stock=p.is_in_stock,
            )
            results.append(item)

        await cache.set_json(
            cache_key,
            [item.model_dump() for item in results],
            expire_seconds=1800,
        )

        return RankingService.filter_and_rank(results, query)
