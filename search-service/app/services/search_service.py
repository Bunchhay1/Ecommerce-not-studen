import hashlib
import json
from typing import Optional
from app.cache.redis import CacheService
from app.core.config import settings
from app.core.logging import logger
from app.repositories.search_repository import SearchRepository
from app.schemas.search import SearchParams, SearchResponse


class SearchService:
    def __init__(self, repository: Optional[SearchRepository] = None):
        self.repository = repository or SearchRepository()

    def _generate_cache_key(self, params: SearchParams) -> str:
        param_dict = params.model_dump(mode="json", exclude_none=True)
        serialized = json.dumps(param_dict, sort_keys=True)
        hash_val = hashlib.md5(serialized.encode("utf-8")).hexdigest()
        return f"search:query:{hash_val}"

    async def search(self, params: SearchParams) -> SearchResponse:
        cache_key = self._generate_cache_key(params)

        # 1. Try reading from Redis cache
        cached_result = await CacheService.get(cache_key)
        if cached_result:
            logger.debug(f"Search cache HIT for key '{cache_key}'")
            return SearchResponse(**cached_result)

        logger.debug(f"Search cache MISS for key '{cache_key}', querying OpenSearch...")
        response = await self.repository.search(params)

        # 2. Store in Redis cache if search succeeded
        if response.items:
            await CacheService.set(
                cache_key,
                response.model_dump(mode="json"),
                ttl_seconds=settings.CACHE_TTL_SEARCH_SECONDS
            )

        return response


def get_search_service() -> SearchService:
    return SearchService()

