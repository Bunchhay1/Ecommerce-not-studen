from typing import Any, Dict
from fastapi import APIRouter
from app.cache.redis import ping_redis
from app.schemas.common import ApiResponse
from app.search.client import ping_opensearch

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=ApiResponse[Dict[str, Any]])
async def health_check():
    """
    Standard health check endpoint.
    """
    return ApiResponse(
        success=True,
        message="Service is healthy",
        data={
            "status": "UP",
            "service": "search-service",
            "version": "1.0.0"
        }
    )


@router.get("/health/live", response_model=ApiResponse[Dict[str, Any]])
async def liveness_check():
    """
    Liveness probe endpoint.
    """
    return ApiResponse(
        success=True,
        message="Service is alive",
        data={"status": "UP"}
    )


@router.get("/health/ready", response_model=ApiResponse[Dict[str, Any]])
async def readiness_check():
    """
    Readiness probe endpoint checking downstream dependencies (OpenSearch, Redis).
    """
    opensearch_ok = await ping_opensearch()
    redis_ok = await ping_redis()

    all_ready = opensearch_ok and redis_ok
    status_str = "UP" if all_ready else "DEGRADED"

    return ApiResponse(
        success=all_ready,
        message=f"Service readiness: {status_str}",
        data={
            "status": status_str,
            "opensearch": "UP" if opensearch_ok else "DOWN",
            "redis": "UP" if redis_ok else "DOWN"
        }
    )
