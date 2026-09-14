import pytest
from unittest.mock import AsyncMock, patch
from app.schemas.search import SearchParams, SearchResponse, SearchResultItem
from app.services.search_service import SearchService


@pytest.mark.asyncio
async def test_search_service_cache_miss_and_set():
    mock_repo = AsyncMock()
    mock_repo.search.return_value = SearchResponse(
        query="laptop",
        page=1,
        size=20,
        total=1,
        total_pages=1,
        items=[
            SearchResultItem(
                product_id="prod-1",
                name="MacBook Pro",
                slug="macbook-pro",
                status="ACTIVE",
                price=1999.0
            )
        ]
    )

    with patch("app.cache.redis.CacheService.get", new_callable=AsyncMock) as mock_cache_get, \
         patch("app.cache.redis.CacheService.set", new_callable=AsyncMock) as mock_cache_set:

        mock_cache_get.return_value = None  # Cache MISS

        service = SearchService(repository=mock_repo)
        params = SearchParams(q="laptop")
        response = await service.search(params)

        assert response.total == 1
        assert response.items[0].name == "MacBook Pro"
        mock_repo.search.assert_called_once_with(params)
        mock_cache_set.assert_called_once()


@pytest.mark.asyncio
async def test_search_service_cache_hit():
    mock_repo = AsyncMock()
    cached_data = {
        "query": "laptop",
        "page": 1,
        "size": 20,
        "total": 1,
        "total_pages": 1,
        "items": [
            {
                "product_id": "prod-1",
                "name": "MacBook Pro",
                "slug": "macbook-pro",
                "status": "ACTIVE",
                "price": 1999.0
            }
        ]
    }

    with patch("app.cache.redis.CacheService.get", new_callable=AsyncMock) as mock_cache_get, \
         patch("app.cache.redis.CacheService.set", new_callable=AsyncMock) as mock_cache_set:

        mock_cache_get.return_value = cached_data  # Cache HIT

        service = SearchService(repository=mock_repo)
        params = SearchParams(q="laptop")
        response = await service.search(params)

        assert response.total == 1
        assert response.items[0].name == "MacBook Pro"
        mock_repo.search.assert_not_called()
        mock_cache_set.assert_not_called()
