import json
import logging
from typing import Optional, Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self.client: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            self.client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await self.client.ping()
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis cache connection failed: {e}. Falling back to DB-only mode.")
            self.client = None

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def get(self, key: str) -> Optional[str]:
        if not self.client:
            return None
        try:
            return await self.client.get(key)
        except Exception as e:
            logger.warning(f"Redis get error for key '{key}': {e}")
            return None

    async def set(self, key: str, value: str, ttl_seconds: int = 300):
        if not self.client:
            return
        try:
            await self.client.set(key, value, ex=ttl_seconds)
        except Exception as e:
            logger.warning(f"Redis set error for key '{key}': {e}")

    async def delete(self, key: str):
        if not self.client:
            return
        try:
            await self.client.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete error for key '{key}': {e}")

redis_cache = RedisCache()
