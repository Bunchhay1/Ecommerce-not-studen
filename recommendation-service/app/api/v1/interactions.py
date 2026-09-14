import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.recommendation_service import RecommendationService
from app.schemas.interaction import InteractionCreate, InteractionResponse
from app.schemas.event import FeedbackCreate, FeedbackResponse
from app.core.security import get_optional_current_user

router = APIRouter(prefix="/recommendations", tags=["Interactions & Feedback"])


@router.post(
    "/interactions",
    response_model=InteractionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def record_interaction(
    interaction: InteractionCreate,
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest user product interaction (VIEW, SEARCH_CLICK, FAVORITE, ADD_TO_CART, PURCHASE).
    Updates interaction history and invalidates user recommendation cache.
    """
    if not interaction.user_id and current_user and "sub" in current_user:
        interaction.user_id = uuid.UUID(current_user["sub"])
    if not interaction.session_id and x_session_id:
        interaction.session_id = x_session_id

    service = RecommendationService(db)
    return await service.record_interaction(interaction)


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def record_feedback(
    feedback: FeedbackCreate,
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log impression, click, or conversion feedback for a served recommendation.
    """
    user_id = uuid.UUID(current_user["sub"]) if current_user and "sub" in current_user else None
    service = RecommendationService(db)
    return await service.record_feedback(
        feedback_data=feedback, user_id=user_id, session_id=x_session_id
    )
