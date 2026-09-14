import time
from typing import Any, Dict, List, Optional
import httpx
from app.cache.redis import CacheService
from app.core.config import settings
from app.core.logging import logger
from app.repositories.search_repository import SearchRepository
from app.schemas.product import ProductImageDoc, ProductIndexDocument, ProductVariantDoc
from app.search.client import get_opensearch_client
from app.search.index import PRODUCT_INDEX_SETTINGS, init_product_index, switch_alias


class IndexService:
    def __init__(self, repository: Optional[SearchRepository] = None):
        self.repository = repository or SearchRepository()

    def transform_catalog_product_to_doc(self, product_data: Dict[str, Any]) -> ProductIndexDocument:
        brand = product_data.get("brand") or {}
        category = product_data.get("category") or {}

        # Parse images
        images: List[ProductImageDoc] = []
        for img in product_data.get("images", []):
            images.append(ProductImageDoc(
                id=img.get("id"),
                url=img.get("url", ""),
                alt_text=img.get("altText") or img.get("alt_text"),
                sort_order=img.get("sortOrder") or img.get("sort_order", 0),
                is_primary=img.get("isPrimary") or img.get("is_primary", False)
            ))

        # Parse variants
        variants: List[ProductVariantDoc] = []
        for var in product_data.get("variants", []):
            variants.append(ProductVariantDoc(
                id=var.get("id", ""),
                sku=var.get("sku", ""),
                status=var.get("status", "ACTIVE"),
                attributes=var.get("attributes", {})
            ))

        # Flatten attributes
        attributes: Dict[str, str] = {}
        for attr in product_data.get("attributes", []):
            attr_name = attr.get("name")
            attr_val = attr.get("value")
            if attr_name and attr_val:
                attributes[attr_name] = str(attr_val)

        return ProductIndexDocument(
            product_id=product_data.get("id") or product_data.get("product_id"),
            name=product_data.get("name", ""),
            slug=product_data.get("slug", ""),
            description=product_data.get("description"),
            category_id=category.get("id") or product_data.get("categoryId") or product_data.get("category_id"),
            category_name=category.get("name") or product_data.get("category_name"),
            category_slug=category.get("slug") or product_data.get("category_slug"),
            brand_id=brand.get("id") or product_data.get("brandId") or product_data.get("brand_id"),
            brand_name=brand.get("name") or product_data.get("brand_name"),
            brand_slug=brand.get("slug") or product_data.get("brand_slug"),
            price=float(product_data.get("price", 0.0)),
            status=product_data.get("status", "ACTIVE"),
            attributes=attributes,
            images=images,
            variants=variants
        )

    async def sync_product(self, product_data: Dict[str, Any]) -> bool:
        doc = self.transform_catalog_product_to_doc(product_data)
        success = await self.repository.index_product(doc)
        if success:
            await CacheService.delete_pattern("search:*")
        return success

    async def delete_product(self, product_id: str) -> bool:
        success = await self.repository.delete_product(product_id)
        if success:
            await CacheService.delete_pattern("search:*")
        return success

    async def update_product_status(self, product_id: str, status: str) -> bool:
        success = await self.repository.update_product_partial(product_id, {"status": status})
        if success:
            await CacheService.delete_pattern("search:*")
        return success

    async def reindex_from_catalog(self) -> Dict[str, Any]:
        """
        Blue/Green Zero-Downtime Reindexing.
        Creates products_v{timestamp}, fetches all products from Catalog Service, indexes them,
        and atomic switches the 'products' alias to the new index.
        """
        client = await get_opensearch_client()
        new_index_name = f"products_v{int(time.time())}"

        logger.info(f"Starting zero-downtime reindexing into '{new_index_name}'...")
        await client.indices.create(index=new_index_name, body=PRODUCT_INDEX_SETTINGS)

        indexed_count = 0
        failed_count = 0

        # Fetch products from Catalog Service REST API
        try:
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                page = 0
                size = 50
                while True:
                    resp = await http_client.get(
                        f"{settings.CATALOG_SERVICE_URL}/api/v1/products",
                        params={"page": page, "size": size}
                    )
                    if resp.status_code != 200:
                        logger.warning(f"Catalog service returned status {resp.status_code}")
                        break

                    data = resp.json().get("data", {})
                    content = data.get("content", [])
                    if not content:
                        break

                    for prod in content:
                        doc = self.transform_catalog_product_to_doc(prod)
                        res = await self.repository.index_product(doc, index_name=new_index_name)
                        if res:
                            indexed_count += 1
                        else:
                            failed_count += 1

                    if data.get("last", True):
                        break
                    page += 1
        except Exception as e:
            logger.warning(f"Reindexing: Could not reach Catalog Service: {str(e)}")

        # Find current active index under alias
        old_index = None
        try:
            aliases = await client.indices.get_alias(name=settings.OPENSEARCH_INDEX_ALIAS)
            if aliases:
                old_index = list(aliases.keys())[0]
        except Exception:
            pass

        # Switch alias to new index
        await switch_alias(client, old_index, new_index_name, settings.OPENSEARCH_INDEX_ALIAS)
        await CacheService.delete_pattern("search:*")

        return {
            "new_index": new_index_name,
            "old_index": old_index,
            "indexed_count": indexed_count,
            "failed_count": failed_count,
            "status": "COMPLETED"
        }


def get_index_service() -> IndexService:
    return IndexService()

