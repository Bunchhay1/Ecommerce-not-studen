from typing import Dict, List, Optional
from app.cache.redis import CacheService
from app.core.config import settings
from app.core.logging import logger
from app.repositories.search_repository import SearchRepository
from app.schemas.search import AutocompleteResponse, SearchSuggestionsResponse


class AutocompleteService:
    def __init__(self, repository: Optional[SearchRepository] = None):
        self.repository = repository or SearchRepository()

    async def get_autocomplete(self, query: str, size: int = 10) -> AutocompleteResponse:
        clean_q = query.strip().lower() if query else ""
        if not clean_q:
            return AutocompleteResponse(query="", suggestions=[])

        cache_key = f"search:autocomplete:{clean_q}:{size}"

        # 1. Try cache
        cached = await CacheService.get(cache_key)
        if cached is not None:
            return AutocompleteResponse(query=clean_q, suggestions=cached)

        # 2. Query repository
        suggestions = await self.repository.autocomplete(clean_q, size=size)

        # 3. Cache results
        await CacheService.set(
            cache_key,
            suggestions,
            ttl_seconds=settings.CACHE_TTL_AUTOCOMPLETE_SECONDS
        )

        return AutocompleteResponse(query=clean_q, suggestions=suggestions)

    async def get_suggestions(self, query: str, size: int = 10) -> SearchSuggestionsResponse:
        auto_res = await self.get_autocomplete(query, size=size)
        return SearchSuggestionsResponse(
            query=query,
            suggestions=auto_res.suggestions,
            popular_categories=[],
            popular_brands=[]
        )


def get_autocomplete_service() -> AutocompleteService:
    return AutocompleteService()

