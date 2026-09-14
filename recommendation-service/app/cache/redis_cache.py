import json
import logging
from typing import Optional, Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("recommendation_service.cache")


class RedisCache:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self._is_available: bool = False

    async def connect(self) -> None:
        try:
            self.redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0,
            )
            await self.redis.ping()
            self._is_available = True
            logger.info("Connected to Redis cache successfully.")
        except Exception as e:
            self._is_available = False
            logger.warning(f"Redis not available ({e}). Running with in-memory caching or cache-bypass.")

    async def disconnect(self) -> None:
        if self.redis:
            await self.redis.close()
            self._is_available = False

    async def get_json(self, key: str) -> Optional[Any]:
        if not self._is_available or not self.redis:
            return None
        try:
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Failed to read from Redis key {key}: {e}")
        return None

    async def set_json(self, key: str, value: Any, expire_seconds: int = 3600) -> bool:
        if not self._is_available or not self.redis:
            return False
        try:
            serialized = json.dumps(value, default=str)
            await self.redis.set(key, serialized, ex=expire_seconds)
            return True
        except Exception as e:
            logger.warning(f"Failed to write to Redis key {key}: {e}")
            return False

    async def delete_keys(self, pattern: str) -> int:
        if not self._is_available or not self.redis:
            return 0
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                return await self.redis.delete(*keys)
        except Exception as e:
            logger.warning(f"Failed to delete Redis keys for pattern {pattern}: {e}")
        return 0


# Global cache instance
cache = RedisCache()
