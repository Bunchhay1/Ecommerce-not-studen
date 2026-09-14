import json
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings
from app.core.logging import logger

_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
    return _redis_client


async def close_redis_client():
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis async client closed.")


async def ping_redis() -> bool:
    try:
        client = await get_redis_client()
        return await client.ping()
    except Exception as e:
        logger.warning(f"Redis ping failed: {str(e)}")
        return False


class CacheService:
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        try:
            client = await get_redis_client()
            data = await client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.debug(f"Cache get error for key '{key}': {str(e)}")
            return None

    @staticmethod
    async def set(key: str, value: Any, ttl_seconds: int = 300):
        try:
            client = await get_redis_client()
            serialized = json.dumps(value, default=str)
            await client.setex(key, ttl_seconds, serialized)
        except Exception as e:
            logger.debug(f"Cache set error for key '{key}': {str(e)}")

    @staticmethod
    async def delete(key: str):
        try:
            client = await get_redis_client()
            await client.delete(key)
        except Exception as e:
            logger.debug(f"Cache delete error for key '{key}': {str(e)}")

    @staticmethod
    async def delete_pattern(pattern: str):
        try:
            client = await get_redis_client()
            keys = await client.keys(pattern)
            if keys:
                await client.delete(*keys)
        except Exception as e:
            logger.debug(f"Cache delete pattern error for pattern '{pattern}': {str(e)}")
