import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.kafka.handlers import EventHandler
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.interaction_repository import InteractionRepository


@pytest.mark.asyncio
async def test_handle_catalog_event(db_session: AsyncSession):
    handler = EventHandler(db_session)
    candidate_repo = CandidateRepository(db_session)

    prod_id = uuid.uuid4()
    cat_id = uuid.uuid4()
    payload = {
        "product_id": str(prod_id),
        "name": "Sony PlayStation 5 Slim",
        "description": "Next-gen gaming console",
        "category_id": str(cat_id),
        "category_name": "Gaming",
        "price": 499.99,
        "brand": "Sony",
        "tags": ["gaming", "playstation", "ps5"],
        "is_active": True,
        "is_in_stock": True,
    }

    await handler.handle_catalog_event("ProductCreated", payload)
    await db_session.commit()

    candidate = await candidate_repo.get_by_id(prod_id)
    assert candidate is not None
    assert candidate.name == "Sony PlayStation 5 Slim"
    assert candidate.price == 499.99


@pytest.mark.asyncio
async def test_handle_order_placed_event(db_session: AsyncSession, sample_candidates):
    handler = EventHandler(db_session)
    interaction_repo = InteractionRepository(db_session)

    user_id = uuid.uuid4()
    p1 = sample_candidates["phone_id"]
    p2 = sample_candidates["case_id"]

    order_payload = {
        "order_id": str(uuid.uuid4()),
        "user_id": str(user_id),
        "items": [
            {"product_id": str(p1), "quantity": 1, "unit_price": 1199.0},
            {"product_id": str(p2), "quantity": 1, "unit_price": 49.0},
        ],
    }

    await handler.handle_order_placed_event(order_payload)
    await db_session.commit()

    interactions = await interaction_repo.get_user_interactions(user_id=user_id)
    assert len(interactions) == 2
    interacted_ids = [i.product_id for i in interactions]
    assert str(p1) in interacted_ids
    assert str(p2) in interacted_ids


@pytest.mark.asyncio
async def test_handle_review_created_event(db_session: AsyncSession, sample_candidates):
    handler = EventHandler(db_session)
    candidate_repo = CandidateRepository(db_session)

    phone_id = sample_candidates["phone_id"]
    initial_product = await candidate_repo.get_by_id(phone_id)
    initial_count = initial_product.review_count

    review_payload = {
        "review_id": str(uuid.uuid4()),
        "product_id": str(phone_id),
        "user_id": str(uuid.uuid4()),
        "rating": 5.0,
    }

    await handler.handle_review_created_event(review_payload)
    await db_session.commit()

    updated = await candidate_repo.get_by_id(phone_id)
    assert updated.review_count == initial_count + 1
