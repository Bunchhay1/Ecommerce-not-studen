import pytest
from unittest.mock import AsyncMock, patch
from app.services.index_service import IndexService


def test_transform_catalog_product_to_doc(sample_catalog_product):
    service = IndexService()
    doc = service.transform_catalog_product_to_doc(sample_catalog_product)

    assert doc.product_id == "prod-100"
    assert doc.name == "iPhone 17 Pro Max"
    assert doc.slug == "iphone-17-pro-max"
    assert doc.brand_name == "Apple"
    assert doc.category_name == "Smartphones"
    assert doc.price == 1299.0
    assert doc.status == "ACTIVE"
    assert doc.attributes == {"color": "Titanium Black", "storage": "256GB"}
    assert len(doc.images) == 1
    assert doc.images[0].is_primary is True
    assert len(doc.variants) == 1
    assert doc.variants[0].sku == "IPH17P-256-BLK"


@pytest.mark.asyncio
async def test_sync_product_indexes_and_evicts_cache(sample_catalog_product):
    mock_repo = AsyncMock()
    mock_repo.index_product.return_value = True

    with patch("app.cache.redis.CacheService.delete_pattern", new_callable=AsyncMock) as mock_evict:
        service = IndexService(repository=mock_repo)
        res = await service.sync_product(sample_catalog_product)

        assert res is True
        mock_repo.index_product.assert_called_once()
        mock_evict.assert_called_once_with("search:*")


@pytest.mark.asyncio
async def test_delete_product_deletes_and_evicts_cache():
    mock_repo = AsyncMock()
    mock_repo.delete_product.return_value = True

    with patch("app.cache.redis.CacheService.delete_pattern", new_callable=AsyncMock) as mock_evict:
        service = IndexService(repository=mock_repo)
        res = await service.delete_product("prod-100")

        assert res is True
        mock_repo.delete_product.assert_called_once_with("prod-100")
        mock_evict.assert_called_once_with("search:*")
