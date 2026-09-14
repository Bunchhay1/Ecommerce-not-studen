from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.cache.redis_cache import cache
from app.ml.model_manager import model_manager

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check verifying database connection, Redis, and ML model status.
    """
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "UP",
        "service": "recommendation-service",
        "database": db_status,
        "redis": "connected" if cache._is_available else "offline",
        "ml_model_loaded": model_manager.content_engine.is_fitted,
    }
