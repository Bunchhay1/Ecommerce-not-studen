import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.trending_service import TrendingService
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.recommendation import RecommendationQuery
from app.schemas.interaction import InteractionCreate
from app.models.interaction import InteractionType


@pytest.mark.asyncio
async def test_trending_cold_start_fallback(db_session: AsyncSession, sample_candidates):
    """
    When no interactions have occurred yet, TrendingService must fall back to top popular/rated products.
    """
    service = TrendingService(db_session)
    query = RecommendationQuery(limit=5)
    results = await service.get_trending(query)

    assert len(results) > 0
    # Results should be populated from catalog popularity/rating
    assert results[0].algorithm == "popularity_cold_start"
    assert results[0].score > 0.0


@pytest.mark.asyncio
async def test_trending_interaction_velocity(db_session: AsyncSession, sample_candidates):
    """
    When user interactions occur, items with higher interaction velocity must rank higher in trending.
    """
    phone_id = sample_candidates["phone_id"]
    samsung_id = sample_candidates["samsung_id"]

    interaction_repo = InteractionRepository(db_session)

    # Add 5 purchases for Samsung
    for _ in range(5):
        await interaction_repo.create_interaction(
            InteractionCreate(
                product_id=samsung_id,
                interaction_type=InteractionType.PURCHASE,
            )
        )

    # Add 1 view for Phone
    await interaction_repo.create_interaction(
        InteractionCreate(
            product_id=phone_id,
            interaction_type=InteractionType.VIEW,
        )
    )
    await db_session.commit()

    service = TrendingService(db_session)
    query = RecommendationQuery(limit=5)
    results = await service.get_trending(query)

    assert len(results) >= 2
    # Samsung has 5 purchases (5 * 10 = 50 weight), while Phone has 1 view (1 weight)
    assert results[0].product_id == samsung_id
    assert results[0].algorithm == "interaction_velocity"
