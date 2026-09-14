from fastapi import APIRouter
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.trending import router as trending_router
from app.api.v1.interactions import router as interactions_router
from app.api.v1.admin import router as admin_router
from app.api.v1.health import router as health_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(recommendations_router)
api_v1_router.include_router(trending_router)
api_v1_router.include_router(interactions_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(health_router)

__all__ = ["api_v1_router"]
