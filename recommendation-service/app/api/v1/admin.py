from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.ml.model_manager import model_manager
from app.cache.redis_cache import cache

router = APIRouter(prefix="/recommendations/admin", tags=["Admin & ML Retraining"])


@router.post("/train")
async def trigger_retraining(db: AsyncSession = Depends(get_db)):
    """
    Manually trigger batch training for the TF-IDF content similarity model and
    refresh item relationships from active candidates.
    """
    num_products = await model_manager.train_content_similarity(db)
    # Invalidate cached recommendations across the board
    await cache.delete_keys("rec:*")
    return {
        "status": "success",
        "message": f"Retrained content similarity model successfully on {num_products} products.",
        "products_processed": num_products,
    }


@router.get("/status")
async def get_system_status():
    """
    Get in-memory model status and cache availability.
    """
    return {
        "is_model_initialized": model_manager.is_initialized,
        "is_tfidf_fitted": model_manager.content_engine.is_fitted,
        "total_tfidf_items": len(model_manager.content_engine.product_ids),
        "cooccurrence_items": len(model_manager.cooccurrence_engine.item_counts),
        "redis_available": cache._is_available,
    }
