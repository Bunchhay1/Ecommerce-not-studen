from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.common import ApiResponse
from app.schemas.search import AutocompleteResponse, SearchSuggestionsResponse
from app.services.autocomplete_service import AutocompleteService, get_autocomplete_service

router = APIRouter(prefix="/search", tags=["Autocomplete & Suggestions"])


@router.get("/autocomplete", response_model=ApiResponse[AutocompleteResponse])
async def get_autocomplete(
    q: str = Query(..., min_length=1, description="Prefix keyword for autocomplete"),
    size: int = Query(10, ge=1, le=50, description="Number of suggestions"),
    service: AutocompleteService = Depends(get_autocomplete_service)
):
    """
    Ultra-fast prefix autocomplete for search inputs.
    """
    result = await service.get_autocomplete(q, size=size)
    return ApiResponse(
        success=True,
        message="Autocomplete suggestions retrieved",
        data=result
    )


@router.get("/suggestions", response_model=ApiResponse[SearchSuggestionsResponse])
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Query string for suggestions"),
    size: int = Query(10, ge=1, le=50, description="Number of suggestions"),
    service: AutocompleteService = Depends(get_autocomplete_service)
):
    """
    Search suggestions including autocomplete, popular brands, and categories.
    """
    result = await service.get_suggestions(q, size=size)
    return ApiResponse(
        success=True,
        message="Search suggestions retrieved",
        data=result
    )
