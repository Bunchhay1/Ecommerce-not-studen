import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.personalization_service import PersonalizationService
from app.repositories.interaction_repository import InteractionRepository
from app.ml.model_manager import model_manager
from app.schemas.recommendation import RecommendationQuery
from app.schemas.interaction import InteractionCreate
from app.models.interaction import InteractionType


@pytest.mark.asyncio
async def test_personalization_cold_start(db_session: AsyncSession, sample_candidates):
    """
    Cold start user with zero interactions should fall back to trending recommendations.
    """
    service = PersonalizationService(db_session)
    user_id = uuid.uuid4()
    query = RecommendationQuery(limit=5)

    results = await service.get_personalized(user_id=user_id, session_id=None, query=query)
    assert len(results) > 0
    assert results[0].algorithm == "cold_start_trending"


@pytest.mark.asyncio
async def test_personalization_with_history(db_session: AsyncSession, sample_candidates):
    """
    User who purchased an iPhone should receive accessories like case and charger recommended.
    """
    # Fit ML model first
    await model_manager.train_content_similarity(db_session)

    user_id = uuid.uuid4()
    phone_id = sample_candidates["phone_id"]
    case_id = sample_candidates["case_id"]

    interaction_repo = InteractionRepository(db_session)
    # User purchased iPhone
    await interaction_repo.create_interaction(
        InteractionCreate(
            user_id=user_id,
            product_id=phone_id,
            interaction_type=InteractionType.PURCHASE,
        )
    )
    await db_session.commit()

    service = PersonalizationService(db_session)
    query = RecommendationQuery(limit=5)
    results = await service.get_personalized(user_id=user_id, session_id=None, query=query)

    assert len(results) > 0
    rec_ids = [r.product_id for r in results]
    # The iPhone itself should be excluded because the user already bought/interacted with it
    assert phone_id not in rec_ids
    # The iPhone case should be suggested
    assert case_id in rec_ids
