import pytest
from unittest.mock import AsyncMock, patch
from app.services.autocomplete_service import AutocompleteService


@pytest.mark.asyncio
async def test_autocomplete_service_caching():
    mock_repo = AsyncMock()
    mock_repo.autocomplete.return_value = ["iphone", "iphone 17", "iphone pro"]

    with patch("app.cache.redis.CacheService.get", new_callable=AsyncMock) as mock_cache_get, \
         patch("app.cache.redis.CacheService.set", new_callable=AsyncMock) as mock_cache_set:

        mock_cache_get.return_value = None

        service = AutocompleteService(repository=mock_repo)
        res = await service.get_autocomplete("iph", size=3)

        assert res.query == "iph"
        assert len(res.suggestions) == 3
        assert res.suggestions[0] == "iphone"
        mock_repo.autocomplete.assert_called_once_with("iph", size=3)
        mock_cache_set.assert_called_once()


@pytest.mark.asyncio
async def test_autocomplete_empty_query():
    service = AutocompleteService()
    res = await service.get_autocomplete("")
    assert res.suggestions == []
