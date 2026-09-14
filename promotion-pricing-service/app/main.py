from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.exceptions import DomainException
from app.db.database import init_db
from app.cache.redis import redis_cache
from app.kafka.producer import kafka_producer
from app.outbox.publisher import outbox_publisher

from app.api.v1.pricing import router as pricing_router
from app.api.v1.promotions import router as promotions_router
from app.api.v1.coupons import router as coupons_router
from app.api.v1.admin import router as admin_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode...")
    # Initialize DB tables
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization deferred/failed: {e}")

    # Connect to Redis
    await redis_cache.connect()

    # Start Kafka Producer
    await kafka_producer.start()

    # Start Outbox Publisher
    outbox_publisher.start()

    yield

    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    await outbox_publisher.stop()
    await kafka_producer.stop()
    await redis_cache.disconnect()

app = FastAPI(
    title="Promotion / Pricing Service",
    description="Core Service #10 — Authoritative pricing, promotion campaigns, discounts, coupons, and cart/order calculation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "errorCode": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "errorCode": "INTERNAL_SERVER_ERROR",
            "message": str(exc),
            "details": {},
        },
    )

# Health & Metrics
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }

# Prometheus metrics mount
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include API v1 routers
app.include_router(pricing_router, prefix="/api/v1")
app.include_router(promotions_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
