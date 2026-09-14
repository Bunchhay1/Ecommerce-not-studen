import pytest
from unittest.mock import AsyncMock, patch
from fastapi import status
from app.schemas.search import AutocompleteResponse, SearchResponse, SearchResultItem


def test_health_endpoints(test_client):
    res = test_client.get("/health")
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["data"]["status"] == "UP"

    res_live = test_client.get("/health/live")
    assert res_live.status_code == status.HTTP_200_OK
    assert res_live.json()["data"]["status"] == "UP"


def test_search_endpoint(test_client):
    mock_search_response = SearchResponse(
        query="phone",
        page=1,
        size=20,
        total=1,
        total_pages=1,
        items=[
            SearchResultItem(
                product_id="prod-100",
                name="iPhone 17 Pro Max",
                slug="iphone-17-pro-max",
                status="ACTIVE",
                price=1299.0
            )
        ]
    )

    with patch("app.services.search_service.SearchService.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_search_response

        res = test_client.get("/api/v1/search?q=phone&min_price=100&max_price=2000")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["success"] is True
        assert data["data"]["total"] == 1
        assert data["data"]["items"][0]["name"] == "iPhone 17 Pro Max"


def test_autocomplete_endpoint(test_client):
    mock_auto_response = AutocompleteResponse(
        query="iph",
        suggestions=["iphone", "iphone 17"]
    )

    with patch("app.services.autocomplete_service.AutocompleteService.get_autocomplete", new_callable=AsyncMock) as mock_auto:
        mock_auto.return_value = mock_auto_response

        res = test_client.get("/api/v1/search/autocomplete?q=iph")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["success"] is True
        assert data["data"]["suggestions"] == ["iphone", "iphone 17"]


def test_admin_reindex_unauthorized(test_client):
    # Missing authorization header
    res = test_client.post("/api/v1/admin/reindex")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_admin_reindex_forbidden_for_customer(test_client, customer_jwt_token):
    # Customer trying to reindex
    headers = {"Authorization": f"Bearer {customer_jwt_token}"}
    res = test_client.post("/api/v1/admin/reindex", headers=headers)
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_admin_reindex_success_for_admin(test_client, admin_jwt_token):
    headers = {"Authorization": f"Bearer {admin_jwt_token}"}
    with patch("app.services.index_service.IndexService.reindex_from_catalog", new_callable=AsyncMock) as mock_reindex:
        mock_reindex.return_value = {
            "new_index": "products_v12345",
            "indexed_count": 50,
            "status": "COMPLETED"
        }
        res = test_client.post("/api/v1/admin/reindex", headers=headers)
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["data"]["status"] == "COMPLETED"
