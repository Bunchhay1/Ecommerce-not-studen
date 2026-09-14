import uuid
import logging
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.ml.content_similarity import ContentSimilarityEngine
from app.ml.cooccurrence_engine import CooccurrenceEngine
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.models.product_relationship import RelationshipType

logger = logging.getLogger("recommendation_service.ml")


class ModelManager:
    """
    Manages in-memory machine learning models and coordinates offline batch retraining.
    """

    def __init__(self):
        self.content_engine = ContentSimilarityEngine()
        self.cooccurrence_engine = CooccurrenceEngine()
        self.is_initialized: bool = False

    async def train_content_similarity(self, db: AsyncSession) -> int:
        """
        Fetches all active candidate products and fits the TF-IDF content similarity model.
        Also persists the top relationships to PostgreSQL for database fallback.
        """
        logger.info("Training Content Similarity (TF-IDF) model...")
        repo = CandidateRepository(db)
        rel_repo = RelationshipRepository(db)

        candidates = await repo.get_all_active(limit=10000)
        if not candidates:
            logger.warning("No active candidates found for TF-IDF training.")
            return 0

        self.content_engine.fit(candidates)
        logger.info(f"TF-IDF fitted with {len(candidates)} products.")

        # Persist top-5 pairwise relationships to database
        saved_count = 0
        for p in candidates:
            similars = self.content_engine.find_similar(p.product_id, top_k=5, min_similarity=0.1)
            for target_id, score in similars:
                await rel_repo.upsert_relationship(
                    source_id=p.product_id,
                    target_id=target_id,
                    relationship_type=RelationshipType.SIMILAR,
                    score=score,
                    support_count=1,
                )
                saved_count += 1

        self.is_initialized = True
        return len(candidates)

    def find_content_similar(
        self, product_id: uuid.UUID, top_k: int = 10
    ) -> List[Tuple[uuid.UUID, float]]:
        return self.content_engine.find_similar(product_id, top_k=top_k)

    def find_cooccurring(
        self, product_id: uuid.UUID, top_k: int = 10
    ) -> List[Tuple[uuid.UUID, float, int]]:
        return self.cooccurrence_engine.get_related(product_id, top_k=top_k)


# Singleton instance
model_manager = ModelManager()
