from typing import Optional
try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    from opensearchpy._async.client import AsyncOpenSearch
from app.core.config import settings
from app.core.logging import logger

_opensearch_client: Optional[AsyncOpenSearch] = None


async def get_opensearch_client() -> AsyncOpenSearch:
    global _opensearch_client
    if _opensearch_client is None:
        hosts = [{
            "host": settings.OPENSEARCH_HOST,
            "port": settings.OPENSEARCH_PORT
        }]
        auth = (settings.OPENSEARCH_USER, settings.OPENSEARCH_PASSWORD) if settings.OPENSEARCH_USER else None

        _opensearch_client = AsyncOpenSearch(
            hosts=hosts,
            http_auth=auth,
            use_ssl=settings.OPENSEARCH_USE_SSL,
            verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
            ssl_show_warn=False,
            timeout=10,
            max_retries=3,
            retry_on_timeout=True
        )
    return _opensearch_client


async def close_opensearch_client():
    global _opensearch_client
    if _opensearch_client is not None:
        await _opensearch_client.close()
        _opensearch_client = None
        logger.info("OpenSearch async client closed.")


async def ping_opensearch() -> bool:
    try:
        client = await get_opensearch_client()
        return await client.ping()
    except Exception as e:
        logger.warning(f"OpenSearch ping failed: {str(e)}")
        return False
