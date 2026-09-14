import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import RecommendationServiceException
from app.db.database import init_db, AsyncSessionLocal
from app.cache.redis_cache import cache
from app.kafka.producer import producer
from app.kafka.consumer import consumer_service
from app.ml.model_manager import model_manager
from app.api.v1 import api_v1_router
from app.api.v1.health import router as root_health_router

setup_logging(log_level=settings.LOG_LEVEL)
logger = logging.getLogger("recommendation_service.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Initializing database tables...")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database table initialization warning: {e}")

    logger.info("Connecting to Redis...")
    await cache.connect()

    logger.info("Starting Kafka Producer and Consumer...")
    await producer.start()
    await consumer_service.start()

    logger.info("Pre-training / loading ML models from candidate catalog...")
    try:
        async with AsyncSessionLocal() as session:
            await model_manager.train_content_similarity(session)
    except Exception as e:
        logger.warning(f"Initial ML training deferred: {e}")

    logger.info(f"Recommendation Service started on port {settings.PORT} [Environment: {settings.ENVIRONMENT}]")
    yield

    # --- Shutdown ---
    logger.info("Shutting down Recommendation Service...")
    await consumer_service.stop()
    await producer.stop()
    await cache.disconnect()
    logger.info("Recommendation Service shutdown complete.")


app = FastAPI(
    title="Recommendation Service",
    description="E-Commerce Microservice for Personalized, Similar, Bought Together, and Trending Recommendations",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RecommendationServiceException)
async def recommendation_exception_handler(request: Request, exc: RecommendationServiceException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "error_code": exc.__class__.__name__,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


# Include API routers
app.include_router(api_v1_router)
app.include_router(root_health_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "recommendation-service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
