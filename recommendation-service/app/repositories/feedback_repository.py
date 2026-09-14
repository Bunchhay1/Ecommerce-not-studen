import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.feedback_event import RecommendationFeedback
from app.schemas.event import FeedbackCreate


class FeedbackRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_feedback(
        self,
        feedback: FeedbackCreate,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
    ) -> RecommendationFeedback:
        record = RecommendationFeedback(
            recommendation_id=feedback.recommendation_id,
            user_id=user_id,
            session_id=session_id,
            product_id=feedback.product_id,
            strategy=feedback.strategy or "PERSONALIZED",
            feedback_type=feedback.feedback_type,
            position=feedback.position,
        )
        self.db.add(record)
        await self.db.flush()
        return record
