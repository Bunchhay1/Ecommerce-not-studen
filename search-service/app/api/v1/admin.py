from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.core.security import TokenPayload, require_role
from app.schemas.common import ApiResponse
from app.search.client import get_opensearch_client
from app.services.index_service import IndexService, get_index_service

router = APIRouter(prefix="/admin", tags=["Admin Search Management"])


@router.post("/reindex", response_model=ApiResponse[Dict[str, Any]])
async def trigger_reindex(
    admin_user: TokenPayload = Depends(require_role("ROLE_ADMIN")),
    index_service: IndexService = Depends(get_index_service)
):
    """
    Trigger blue/green zero-downtime reindexing of product search index.
    Protected: ROLE_ADMIN only.
    """
    result = await index_service.reindex_from_catalog()
    return ApiResponse(
        success=True,
        message="Search index rebuilt and switched successfully",
        data=result
    )


@router.get("/indices", response_model=ApiResponse[Dict[str, Any]])
async def get_indices_info(
    admin_user: TokenPayload = Depends(require_role("ROLE_ADMIN"))
):
    """
    Get OpenSearch indices and alias mappings.
    Protected: ROLE_ADMIN only.
    """
    client = await get_opensearch_client()
    aliases = await client.indices.get_alias()
    stats = await client.indices.stats()

    return ApiResponse(
        success=True,
        message="Indices info retrieved",
        data={
            "aliases": aliases,
            "indices_count": len(stats.get("indices", {}))
        }
    )
