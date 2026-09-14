from typing import Any, Dict, List, Optional
try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    from opensearchpy._async.client import AsyncOpenSearch
from app.core.config import settings
from app.core.logging import logger
from app.schemas.product import ProductIndexDocument
from app.schemas.search import (
    FacetBucket,
    SearchParams,
    SearchResultItem,
    SearchFacets,
    SearchResponse,
)
from app.search.client import get_opensearch_client
from app.search.query import (
    build_search_query,
    build_autocomplete_query,
    build_fallback_autocomplete_query,
)


class SearchRepository:
    def __init__(self, client: Optional[AsyncOpenSearch] = None):
        self._client = client

    async def _get_client(self) -> AsyncOpenSearch:
        if self._client is None:
            self._client = await get_opensearch_client()
        return self._client

    async def index_product(self, doc: ProductIndexDocument, index_name: Optional[str] = None) -> bool:
        client = await self._get_client()
        target_index = index_name or settings.OPENSEARCH_INDEX_ALIAS

        # Generate suggest completions (name, brand, category, keywords)
        suggest_inputs = [doc.name]
        if doc.brand_name:
            suggest_inputs.append(f"{doc.brand_name} {doc.name}")
            suggest_inputs.append(doc.brand_name)
        if doc.category_name:
            suggest_inputs.append(f"{doc.category_name} {doc.name}")

        body = doc.model_dump(mode="json")
        body["suggest"] = {
            "input": list(set(suggest_inputs)),
            "weight": 10 if doc.status == "ACTIVE" else 1
        }

        try:
            await client.index(
                index=target_index,
                id=doc.product_id,
                body=body,
                refresh=True
            )
            logger.info(f"Indexed product '{doc.product_id}' ({doc.name}) into '{target_index}'")
            return True
        except Exception as e:
            logger.error(f"Failed to index product '{doc.product_id}': {str(e)}")
            return False

    async def update_product_partial(self, product_id: str, fields: Dict[str, Any], index_name: Optional[str] = None) -> bool:
        client = await self._get_client()
        target_index = index_name or settings.OPENSEARCH_INDEX_ALIAS

        try:
            await client.update(
                index=target_index,
                id=product_id,
                body={"doc": fields},
                refresh=True
            )
            logger.info(f"Updated product '{product_id}' in '{target_index}'")
            return True
        except Exception as e:
            logger.error(f"Failed to update product '{product_id}': {str(e)}")
            return False

    async def delete_product(self, product_id: str, index_name: Optional[str] = None) -> bool:
        client = await self._get_client()
        target_index = index_name or settings.OPENSEARCH_INDEX_ALIAS

        try:
            await client.delete(
                index=target_index,
                id=product_id,
                refresh=True
            )
            logger.info(f"Deleted product '{product_id}' from '{target_index}'")
            return True
        except Exception as e:
            logger.error(f"Failed to delete product '{product_id}': {str(e)}")
            return False

    async def search(self, params: SearchParams) -> SearchResponse:
        client = await self._get_client()
        query_body = build_search_query(params)

        try:
            res = await client.search(
                index=settings.OPENSEARCH_INDEX_ALIAS,
                body=query_body
            )

            hits_data = res.get("hits", {})
            total_hits = hits_data.get("total", {}).get("value", 0)
            hits = hits_data.get("hits", [])
            took_ms = res.get("took", 0)

            items: List[SearchResultItem] = []
            for hit in hits:
                source = hit.get("_source", {})
                score = hit.get("_score")

                # Find primary image if available
                images = source.get("images", [])
                primary_img = next((img.get("url") for img in images if img.get("is_primary")), None)
                if not primary_img and images:
                    primary_img = images[0].get("url")

                item = SearchResultItem(
                    product_id=source.get("product_id") or hit.get("_id"),
                    name=source.get("name", ""),
                    slug=source.get("slug", ""),
                    description=source.get("description"),
                    category_id=source.get("category_id"),
                    category_name=source.get("category_name"),
                    brand_id=source.get("brand_id"),
                    brand_name=source.get("brand_name"),
                    price=source.get("price", 0.0),
                    status=source.get("status", "ACTIVE"),
                    primary_image_url=primary_img,
                    attributes=source.get("attributes", {}),
                    score=score
                )
                items.append(item)

            # Process Facets
            aggs = res.get("aggregations", {})
            category_buckets = [
                FacetBucket(key=b.get("key"), count=b.get("doc_count"))
                for b in aggs.get("categories", {}).get("buckets", [])
            ]
            brand_buckets = [
                FacetBucket(key=b.get("key"), count=b.get("doc_count"))
                for b in aggs.get("brands", {}).get("buckets", [])
            ]
            price_stats = aggs.get("price_stats")

            facets = SearchFacets(
                categories=category_buckets,
                brands=brand_buckets,
                price_stats=price_stats
            )

            total_pages = (total_hits + params.size - 1) // params.size if total_hits > 0 else 1

            return SearchResponse(
                query=params.q,
                page=params.page,
                size=params.size,
                total=total_hits,
                total_pages=total_pages,
                items=items,
                facets=facets,
                took_ms=took_ms
            )
        except Exception as e:
            logger.error(f"Search execution failed: {str(e)}")
            return SearchResponse(
                query=params.q,
                page=params.page,
                size=params.size,
                total=0,
                total_pages=1,
                items=[],
                facets=SearchFacets(),
                took_ms=0
            )

    async def autocomplete(self, prefix: str, size: int = 10) -> List[str]:
        if not prefix or not prefix.strip():
            return []

        client = await self._get_client()
        query_body = build_autocomplete_query(prefix.strip(), size)

        try:
            res = await client.search(
                index=settings.OPENSEARCH_INDEX_ALIAS,
                body=query_body
            )

            suggestions: List[str] = []
            suggest_results = res.get("suggest", {}).get("product_suggest", [])
            if suggest_results and len(suggest_results) > 0:
                options = suggest_results[0].get("options", [])
                for opt in options:
                    text = opt.get("text")
                    if text and text not in suggestions:
                        suggestions.append(text)

            # Fallback to edge_ngram if completion returned few results
            if len(suggestions) < size:
                fallback_body = build_fallback_autocomplete_query(prefix.strip(), size - len(suggestions))
                fallback_res = await client.search(
                    index=settings.OPENSEARCH_INDEX_ALIAS,
                    body=fallback_body
                )
                for hit in fallback_res.get("hits", {}).get("hits", []):
                    name = hit.get("_source", {}).get("name")
                    if name and name not in suggestions:
                        suggestions.append(name)

            return suggestions[:size]
        except Exception as e:
            logger.error(f"Autocomplete execution failed: {str(e)}")
            return []
