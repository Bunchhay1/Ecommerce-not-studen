import json
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.promotion import Promotion
from app.models.promotion_target import PromotionTarget
from app.models.promotion_rule import PromotionRule
from app.models.outbox_event import OutboxEvent
from app.repositories.promotion_repository import PromotionRepository
from app.schemas.promotion import PromotionCreateDto, PromotionUpdateDto
from app.core.exceptions import (
    PromotionNotFoundException,
    PromotionNotActiveException,
    InvalidDiscountException,
)
from app.kafka.events import create_event_payload

class PromotionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PromotionRepository(db)

    async def create_promotion(self, dto: PromotionCreateDto) -> Promotion:
        if dto.discount_value < Decimal("0.00"):
            raise InvalidDiscountException("Discount value cannot be negative")

        promo = Promotion(
            name=dto.name,
            code=dto.code.upper() if dto.code else None,
            type=dto.type.value if hasattr(dto.type, "value") else str(dto.type),
            status="ACTIVE" if dto.start_at is None else "SCHEDULED",
            priority=dto.priority,
            discount_value=dto.discount_value,
            buy_quantity=dto.buy_quantity,
            get_quantity=dto.get_quantity,
            description=dto.description,
            start_at=dto.start_at,
            end_at=dto.end_at,
            usage_limit=dto.usage_limit,
            per_user_limit=dto.per_user_limit,
            min_order_amount=dto.min_order_amount,
            max_discount_amount=dto.max_discount_amount,
            is_stackable=dto.is_stackable,
        )

        for target in dto.targets:
            promo.targets.append(
                PromotionTarget(
                    target_type=target.target_type.upper(),
                    target_id=target.target_id,
                )
            )

        for rule in dto.rules:
            promo.rules.append(
                PromotionRule(
                    rule_type=rule.rule_type.upper(),
                    operator=rule.operator.upper(),
                    value=rule.value,
                )
            )

        created = await self.repo.create(promo)

        # Outbox event
        event = OutboxEvent(
            aggregate_type="Promotion",
            aggregate_id=created.id,
            event_type="PromotionCreated",
            payload=json.dumps(create_event_payload("PromotionCreated", created.id, {
                "promotionId": created.id,
                "name": created.name,
                "type": created.type,
                "discountValue": str(created.discount_value),
            })),
        )
        self.db.add(event)
        await self.db.commit()

        return created

    async def get_promotion(self, promo_id: str) -> Promotion:
        promo = await self.repo.get_by_id(promo_id)
        if not promo:
            raise PromotionNotFoundException(promo_id)
        return promo

    async def list_promotions(self, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Promotion]:
        return await self.repo.list_promotions(status=status, skip=skip, limit=limit)

    async def update_promotion(self, promo_id: str, dto: PromotionUpdateDto) -> Promotion:
        promo = await self.get_promotion(promo_id)
        if dto.name is not None:
            promo.name = dto.name
        if dto.description is not None:
            promo.description = dto.description
        if dto.discount_value is not None:
            promo.discount_value = dto.discount_value
        if dto.start_at is not None:
            promo.start_at = dto.start_at
        if dto.end_at is not None:
            promo.end_at = dto.end_at
        if dto.usage_limit is not None:
            promo.usage_limit = dto.usage_limit
        if dto.per_user_limit is not None:
            promo.per_user_limit = dto.per_user_limit
        if dto.min_order_amount is not None:
            promo.min_order_amount = dto.min_order_amount
        if dto.max_discount_amount is not None:
            promo.max_discount_amount = dto.max_discount_amount
        if dto.is_stackable is not None:
            promo.is_stackable = dto.is_stackable
        if dto.priority is not None:
            promo.priority = dto.priority

        saved = await self.repo.save(promo)

        event = OutboxEvent(
            aggregate_type="Promotion",
            aggregate_id=saved.id,
            event_type="PromotionUpdated",
            payload=json.dumps(create_event_payload("PromotionUpdated", saved.id, {
                "promotionId": saved.id,
                "name": saved.name,
            })),
        )
        self.db.add(event)
        await self.db.commit()
        return saved

    async def activate_promotion(self, promo_id: str) -> Promotion:
        promo = await self.get_promotion(promo_id)
        promo.status = "ACTIVE"
        saved = await self.repo.save(promo)

        event = OutboxEvent(
            aggregate_type="Promotion",
            aggregate_id=saved.id,
            event_type="PromotionActivated",
            payload=json.dumps(create_event_payload("PromotionActivated", saved.id, {
                "promotionId": saved.id,
                "name": saved.name,
            })),
        )
        self.db.add(event)
        await self.db.commit()
        return saved

    async def pause_promotion(self, promo_id: str) -> Promotion:
        promo = await self.get_promotion(promo_id)
        promo.status = "PAUSED"
        saved = await self.repo.save(promo)

        event = OutboxEvent(
            aggregate_type="Promotion",
            aggregate_id=saved.id,
            event_type="PromotionPaused",
            payload=json.dumps(create_event_payload("PromotionPaused", saved.id, {
                "promotionId": saved.id,
            })),
        )
        self.db.add(event)
        await self.db.commit()
        return saved

    async def cancel_promotion(self, promo_id: str) -> Promotion:
        promo = await self.get_promotion(promo_id)
        promo.status = "CANCELLED"
        saved = await self.repo.save(promo)

        event = OutboxEvent(
            aggregate_type="Promotion",
            aggregate_id=saved.id,
            event_type="PromotionCancelled",
            payload=json.dumps(create_event_payload("PromotionCancelled", saved.id, {
                "promotionId": saved.id,
            })),
        )
        self.db.add(event)
        await self.db.commit()
        return saved
