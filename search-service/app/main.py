import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import admin, autocomplete, health, search
from app.cache.redis import close_redis_client
from app.core.config import settings
from app.core.logging import logger
from app.kafka.consumer import start_kafka_consumer, stop_kafka_consumer
from app.kafka.producer import close_kafka_producer
from app.search.client import close_opensearch_client, get_opensearch_client
from app.search.index import init_product_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")

    # 1. Initialize OpenSearch index & alias
    try:
        client = await get_opensearch_client()
        await init_product_index(client)
    except Exception as e:
        logger.warning(f"OpenSearch index initialization deferred: {str(e)}")

    # 2. Start Kafka Background Consumer
    try:
        await start_kafka_consumer()
    except Exception as e:
        logger.warning(f"Kafka consumer start deferred: {str(e)}")

    yield

    # Graceful Shutdown
    logger.info("Shutting down Search Service resources...")
    await stop_kafka_consumer()
    await close_kafka_producer()
    await close_opensearch_client()
    await close_redis_client()
    logger.info("Search Service shutdown complete.")


app = FastAPI(
    title="Search Service",
    description="High-performance product search, filtering, autocomplete, and indexing service backed by OpenSearch and Redis.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID & Logging Middleware
@app.middleware("http")
async def logging_and_timing_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time_ms = int((time.time() - start_time) * 1000)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)

    logger.info(
        f"{request.method} {request.url.path} -> status={response.status_code} took={process_time_ms}ms",
        extra={"request_id": request_id}
    )
    return response


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True, extra={"request_id": request_id})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "request_id": request_id,
                "detail": str(exc) if settings.DEBUG else None
            }
        }
    )


# Mount Routers
app.include_router(health.router)
app.include_router(search.router, prefix="/api/v1")
app.include_router(autocomplete.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "UP",
        "docs": "/docs"
    }
