import uuid
import pytest
from httpx import AsyncClient
from app.ml.model_manager import model_manager


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "recommendation-service"


@pytest.mark.asyncio
async def test_get_trending_api(client: AsyncClient, sample_candidates):
    response = await client.get("/api/v1/recommendations/trending?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "TRENDING"
    assert "items" in data
    assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_get_similar_api(client: AsyncClient, sample_candidates, db_session):
    phone_id = sample_candidates["phone_id"]
    await model_manager.train_content_similarity(db_session)

    response = await client.get(f"/api/v1/recommendations/similar/{phone_id}?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "SIMILAR"
    assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_get_bought_together_api(client: AsyncClient, sample_candidates):
    phone_id = sample_candidates["phone_id"]

    response = await client.get(f"/api/v1/recommendations/bought-together/{phone_id}?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "BOUGHT_TOGETHER"
    assert "items" in data


@pytest.mark.asyncio
async def test_get_personalized_api_anonymous(client: AsyncClient, sample_candidates):
    response = await client.get(
        "/api/v1/recommendations/personalized?limit=5",
        headers={"X-Session-ID": "sess-test-12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "PERSONALIZED"
    assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_record_interaction_api(client: AsyncClient, sample_candidates):
    phone_id = sample_candidates["phone_id"]
    payload = {
        "product_id": str(phone_id),
        "interaction_type": "VIEW",
        "duration_seconds": 45,
    }
    response = await client.post(
        "/api/v1/recommendations/interactions",
        json=payload,
        headers={"X-Session-ID": "sess-test-12345"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == str(phone_id)
    assert data["interaction_type"] == "VIEW"


@pytest.mark.asyncio
async def test_record_feedback_api(client: AsyncClient, sample_candidates):
    phone_id = sample_candidates["phone_id"]
    payload = {
        "recommendation_id": "rec_test123",
        "product_id": str(phone_id),
        "feedback_type": "CLICKED",
        "position": 0,
        "strategy": "SIMILAR",
    }
    response = await client.post(
        "/api/v1/recommendations/feedback",
        json=payload,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["feedback_type"] == "CLICKED"


@pytest.mark.asyncio
async def test_admin_retrain_api(client: AsyncClient, sample_candidates):
    response = await client.post("/api/v1/recommendations/admin/train")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["products_processed"] >= 5


@pytest.mark.asyncio
async def test_admin_status_api(client: AsyncClient):
    response = await client.get("/api/v1/recommendations/admin/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_model_initialized" in data
