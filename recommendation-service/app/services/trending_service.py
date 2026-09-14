import uuid
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.recommendation import RecommendationItem, RecommendationQuery
from app.cache.redis_cache import cache
from app.services.ranking_service import RankingService


class TrendingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.interaction_repo = InteractionRepository(db)

    async def get_trending(
        self, query: RecommendationQuery, hours: int = 24
    ) -> List[RecommendationItem]:
        cat_suffix = str(query.category_id) if query.category_id else "all"
        cache_key = f"rec:trending:{cat_suffix}:{hours}h"
        cached = await cache.get_json(cache_key)
        if cached:
            items = [RecommendationItem(**item) for item in cached]
            return RankingService.filter_and_rank(items, query)

        # 1. Query weighted interaction aggregations over recent window
        trending_counts = await self.interaction_repo.get_trending_product_counts(
            hours=hours, limit=query.limit * 3
        )

        scores_map: Dict[str, float] = {}
        algorithm_used = "interaction_velocity"

        if trending_counts:
            max_weight = max([weight for _, weight in trending_counts]) or 1.0
            for product_id, weight in trending_counts:
                scores_map[str(product_id)] = round(weight / max_weight, 4)

        # 2. Cold-start fallback: Top rated / popular products from catalog candidate table
        if not scores_map:
            popular_items = await self.candidate_repo.get_top_popular(
                limit=query.limit * 2,
                category_id=query.category_id,
                only_in_stock=query.only_in_stock,
            )
            for p in popular_items:
                rating = getattr(p, "rating", 4.5)
                scores_map[str(p.product_id)] = min(1.0, round((rating / 5.0) * 0.9 + 0.1, 4))
            algorithm_used = "popularity_cold_start"

        if not scores_map:
            return []

        products = await self.candidate_repo.get_by_ids(list(scores_map.keys()))
        prod_map = {str(p.product_id): p for p in products}

        results: List[RecommendationItem] = []
        for pid_str, score in scores_map.items():
            p = prod_map.get(pid_str)
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
                score=score,
                reason="Trending popular in store right now",
                algorithm=algorithm_used,
                is_in_stock=p.is_in_stock,
            )
            results.append(item)

        await cache.set_json(
            cache_key,
            [item.model_dump() for item in results],
            expire_seconds=900,
        )

        return RankingService.filter_and_rank(results, query)
