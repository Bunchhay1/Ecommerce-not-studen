from typing import Any, Dict, Optional
try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    from opensearchpy._async.client import AsyncOpenSearch
from app.core.config import settings
from app.core.logging import logger

PRODUCT_INDEX_SETTINGS: Dict[str, Any] = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {
            "analyzer": {
                "autocomplete_analyzer": {
                    "type": "custom",
                    "tokenizer": "autocomplete_tokenizer",
                    "filter": ["lowercase", "asciifolding"]
                },
                "autocomplete_search_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "asciifolding"]
                }
            },
            "tokenizer": {
                "autocomplete_tokenizer": {
                    "type": "edge_ngram",
                    "min_gram": 2,
                    "max_gram": 20,
                    "token_chars": ["letter", "digit"]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "product_id": {"type": "keyword"},
            "name": {
                "type": "text",
                "analyzer": "standard",
                "fields": {
                    "autocomplete": {
                        "type": "text",
                        "analyzer": "autocomplete_analyzer",
                        "search_analyzer": "autocomplete_search_analyzer"
                    },
                    "keyword": {"type": "keyword", "ignore_above": 256}
                }
            },
            "slug": {"type": "keyword"},
            "description": {"type": "text", "analyzer": "standard"},
            "category_id": {"type": "keyword"},
            "category_name": {
                "type": "text",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "category_slug": {"type": "keyword"},
            "brand_id": {"type": "keyword"},
            "brand_name": {
                "type": "text",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "brand_slug": {"type": "keyword"},
            "price": {"type": "double"},
            "status": {"type": "keyword"},
            "attributes": {"type": "object", "dynamic": True},
            "images": {
                "type": "nested",
                "properties": {
                    "id": {"type": "keyword"},
                    "url": {"type": "keyword", "index": False},
                    "alt_text": {"type": "text"},
                    "sort_order": {"type": "integer"},
                    "is_primary": {"type": "boolean"}
                }
            },
            "variants": {
                "type": "nested",
                "properties": {
                    "id": {"type": "keyword"},
                    "sku": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "attributes": {"type": "object", "dynamic": True}
                }
            },
            "suggest": {"type": "completion"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"}
        }
    }
}


async def init_product_index(client: AsyncOpenSearch, index_name: str = None, alias_name: str = None) -> bool:
    target_index = index_name or settings.OPENSEARCH_INDEX_NAME
    target_alias = alias_name or settings.OPENSEARCH_INDEX_ALIAS

    try:
        index_exists = await client.indices.exists(index=target_index)
        if not index_exists:
            logger.info(f"Creating OpenSearch index '{target_index}'...")
            await client.indices.create(index=target_index, body=PRODUCT_INDEX_SETTINGS)
            logger.info(f"OpenSearch index '{target_index}' created successfully.")

        # Ensure alias points to the index
        alias_exists = await client.indices.exists_alias(name=target_alias)
        if not alias_exists:
            logger.info(f"Creating alias '{target_alias}' -> '{target_index}'...")
            await client.indices.put_alias(index=target_index, name=target_alias)
            logger.info(f"Alias '{target_alias}' created.")

        return True
    except Exception as e:
        logger.error(f"Failed to initialize OpenSearch index '{target_index}': {str(e)}")
        return False


async def switch_alias(client: AsyncOpenSearch, old_index: str, new_index: str, alias_name: str = None) -> bool:
    alias = alias_name or settings.OPENSEARCH_INDEX_ALIAS
    actions = []
    if old_index:
        actions.append({"remove": {"index": old_index, "alias": alias}})
    actions.append({"add": {"index": new_index, "alias": alias}})

    try:
        await client.indices.update_aliases(body={"actions": actions})
        logger.info(f"Switched alias '{alias}' to '{new_index}'")
        return True
    except Exception as e:
        logger.error(f"Failed to switch alias '{alias}': {str(e)}")
        return False
