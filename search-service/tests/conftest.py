import os
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
import jwt
from app.core.config import settings
from app.main import app
from app.schemas.search import SearchParams, SortOption


@pytest.fixture(autouse=True)
def mock_env():
    os.environ["APP_ENV"] = "test"
    os.environ["DEBUG"] = "true"


@pytest.fixture
def test_client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def admin_jwt_token():
    payload = {
        "sub": "admin-user-123",
        "roles": ["ROLE_ADMIN"],
        "exp": 9999999999
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def customer_jwt_token():
    payload = {
        "sub": "customer-user-456",
        "roles": ["ROLE_CUSTOMER"],
        "exp": 9999999999
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def sample_catalog_product():
    return {
        "id": "prod-100",
        "name": "iPhone 17 Pro Max",
        "slug": "iphone-17-pro-max",
        "description": "Apple flagship smartphone with A19 Pro chip",
        "price": 1299.0,
        "status": "ACTIVE",
        "brand": {
            "id": "brand-apple",
            "name": "Apple",
            "slug": "apple"
        },
        "category": {
            "id": "cat-smartphones",
            "name": "Smartphones",
            "slug": "smartphones"
        },
        "attributes": [
            {"name": "color", "value": "Titanium Black"},
            {"name": "storage", "value": "256GB"}
        ],
        "images": [
            {
                "id": "img-1",
                "url": "https://images.example.com/iphone17.png",
                "alt_text": "iPhone 17 Front",
                "sort_order": 0,
                "is_primary": True
            }
        ],
        "variants": [
            {
                "id": "var-1",
                "sku": "IPH17P-256-BLK",
                "status": "ACTIVE",
                "attributes": {"color": "Black", "storage": "256GB"}
            }
        ]
    }
