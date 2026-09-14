from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coupon import Coupon
from app.models.promotion import Promotion
from app.models.outbox_event import OutboxEvent
from app.repositories.coupon_repository import CouponRepository
from app.repositories.promotion_repository import PromotionRepository
from app.repositories.usage_repository import UsageRepository
from app.schemas.coupon import CouponCreateDto, CouponValidateRequest, CouponValidateResponse
from app.core.exceptions import (
    CouponNotFoundException,
    CouponExpiredException,
    CouponDisabledException,
    CouponUsageLimitReachedException,
    CouponUserLimitReachedException,
    CouponMinOrderNotMetException,
    DuplicateCouponException,
    PromotionNotFoundException,
)
from app.kafka.events import create_event_payload
from app.services.discount_engine import DiscountEngine
import json

class CouponService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.coupon_repo = CouponRepository(db)
        self.promo_repo = PromotionRepository(db)
        self.usage_repo = UsageRepository(db)

    async def create_coupon(self, dto: CouponCreateDto) -> Coupon:
        existing = await self.coupon_repo.get_by_code(dto.code)
        if existing:
            raise DuplicateCouponException(dto.code)

        promo = await self.promo_repo.get_by_id(dto.promotion_id)
        if not promo:
            raise PromotionNotFoundException(dto.promotion_id)

        coupon = Coupon(
            promotion_id=dto.promotion_id,
            code=dto.code.upper(),
            status="ACTIVE",
            usage_limit=dto.usage_limit,
            per_user_limit=dto.per_user_limit,
            expires_at=dto.expires_at,
        )
        created = await self.coupon_repo.create(coupon)

        # Outbox event
        event = OutboxEvent(
            aggregate_type="Coupon",
            aggregate_id=created.id,
            event_type="CouponCreated",
            payload=json.dumps(create_event_payload("CouponCreated", created.id, {
                "couponId": created.id,
                "code": created.code,
                "promotionId": created.promotion_id,
            })),
        )
        self.db.add(event)
        await self.db.commit()

        return created

    async def validate_coupon(
        self,
        code: str,
        user_id: Optional[str],
        cart_subtotal: Decimal,
        raise_on_invalid: bool = False,
    ) -> Tuple_Validation:
        coupon = await self.coupon_repo.get_by_code(code)
        if not coupon:
            if raise_on_invalid:
                raise CouponNotFoundException(code)
            return False, Decimal("0.00"), None, f"Coupon '{code}' not found", None

        if coupon.status != "ACTIVE":
            if raise_on_invalid:
                raise CouponDisabledException(code)
            return False, Decimal("0.00"), coupon, f"Coupon '{code}' is not active", None

        now = datetime.now(timezone.utc)
        if coupon.expires_at and now > coupon.expires_at:
            if raise_on_invalid:
                raise CouponExpiredException(code)
            return False, Decimal("0.00"), coupon, f"Coupon '{code}' has expired", None

        if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
            if raise_on_invalid:
                raise CouponUsageLimitReachedException(code)
            return False, Decimal("0.00"), coupon, f"Coupon '{code}' usage limit reached", None

        if user_id and coupon.per_user_limit is not None:
            user_uses = await self.usage_repo.get_user_coupon_usage_count(coupon.id, user_id)
            if user_uses >= coupon.per_user_limit:
                if raise_on_invalid:
                    raise CouponUserLimitReachedException(code, user_id)
                return False, Decimal("0.00"), coupon, f"User has reached usage limit for coupon '{code}'", None

        promo = await self.promo_repo.get_by_id(coupon.promotion_id)
        if not promo or promo.status != "ACTIVE":
            if raise_on_invalid:
                raise CouponDisabledException(code)
            return False, Decimal("0.00"), coupon, "Associated promotion is not active", None

        if promo.min_order_amount is not None and cart_subtotal < promo.min_order_amount:
            if raise_on_invalid:
                raise CouponMinOrderNotMetException(code, float(promo.min_order_amount), float(cart_subtotal))
            return False, Decimal("0.00"), coupon, f"Minimum order amount of {promo.min_order_amount} not met", None

        # Calculate discount from linked promo
        discount = DiscountEngine.calculate_order_discount(
            promo_type=promo.type,
            discount_value=promo.discount_value,
            order_subtotal=cart_subtotal,
            max_discount_amount=promo.max_discount_amount,
        )

        return True, discount, coupon, None, promo

    async def record_usage(
        self,
        code: str,
        user_id: str,
        discount_amount: Decimal,
        order_id: Optional[str] = None,
    ):
        coupon = await self.coupon_repo.get_by_code(code)
        if not coupon:
            raise CouponNotFoundException(code)

        # Atomic increment
        success = await self.coupon_repo.increment_usage_atomic(coupon.id)
        if not success:
            raise CouponUsageLimitReachedException(code)

        # Record per-user usage
        usage = await self.usage_repo.record_usage(
            promotion_id=coupon.promotion_id,
            user_id=user_id,
            discount_amount=discount_amount,
            coupon_id=coupon.id,
            order_id=order_id,
        )

        # Outbox event
        event = OutboxEvent(
            aggregate_type="Coupon",
            aggregate_id=coupon.id,
            event_type="CouponUsed",
            payload=json.dumps(create_event_payload("CouponUsed", coupon.id, {
                "couponId": coupon.id,
                "code": coupon.code,
                "userId": user_id,
                "orderId": order_id,
                "discountAmount": str(discount_amount),
            })),
        )
        self.db.add(event)
        await self.db.commit()

        return usage

# Type alias helper
Tuple_Validation = tuple[bool, Decimal, Optional[Coupon], Optional[str], Optional[Promotion]]
