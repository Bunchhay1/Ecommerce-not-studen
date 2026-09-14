import uuid
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product_relationship import RelationshipType
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.schemas.recommendation import RecommendationItem, RecommendationQuery
from app.ml.model_manager import model_manager
from app.cache.redis_cache import cache
from app.services.ranking_service import RankingService


class SimilarityService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.rel_repo = RelationshipRepository(db)

    async def get_similar(
        self, product_id: uuid.UUID | str, query: RecommendationQuery
    ) -> List[RecommendationItem]:
        pid_str = str(product_id)
        cache_key = f"rec:prod:{pid_str}:SIMILAR"
        cached = await cache.get_json(cache_key)
        if cached:
            items = [RecommendationItem(**item) for item in cached]
            return RankingService.filter_and_rank(items, query)

        scores_map: Dict[str, float] = {}
        algorithm_used = "tfidf_content"

        similar_pairs = model_manager.find_content_similar(pid_str, top_k=query.limit * 2)
        for target_id, score in similar_pairs:
            scores_map[str(target_id)] = score

        if not scores_map:
            db_rels = await self.rel_repo.get_relationships(
                pid_str, RelationshipType.SIMILAR, limit=query.limit * 2
            )
            for rel in db_rels:
                scores_map[str(rel.related_product_id)] = rel.score
            if db_rels:
                algorithm_used = "db_relationship"

        if not scores_map:
            source_product = await self.candidate_repo.get_by_id(pid_str)
            if source_product and source_product.category_id:
                category_items = await self.candidate_repo.get_all_active(
                    category_id=source_product.category_id,
                    limit=query.limit + 1,
                    only_in_stock=query.only_in_stock,
                )
                for item in category_items:
                    if str(item.product_id) != pid_str:
                        scores_map[str(item.product_id)] = 0.50
                algorithm_used = "category_fallback"

        if not scores_map:
            return []

        products = await self.candidate_repo.get_by_ids(list(scores_map.keys()))
        prod_map = {str(p.product_id): p for p in products}

        results: List[RecommendationItem] = []
        for target_id_str, score in scores_map.items():
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
                score=score,
                reason=f"Similar features to {p.name}",
                algorithm=algorithm_used,
                is_in_stock=p.is_in_stock,
            )
            results.append(item)

        await cache.set_json(
            cache_key,
            [item.model_dump() for item in results],
            expire_seconds=3600,
        )

        return RankingService.filter_and_rank(results, query)
