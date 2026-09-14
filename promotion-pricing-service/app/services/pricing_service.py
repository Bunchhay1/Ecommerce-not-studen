from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product_price import ProductPrice
from app.repositories.price_repository import PriceRepository
from app.repositories.promotion_repository import PromotionRepository
from app.services.coupon_service import CouponService
from app.services.discount_engine import DiscountEngine
from app.services.eligibility_service import EligibilityService
from app.schemas.pricing import (
    PricingCalculateRequest,
    PricingCalculateResponse,
    ItemPriceBreakdown,
    AppliedPromotionDto,
    ProductPriceCreateDto,
    ProductPriceResponseDto,
)
from app.core.exceptions import PriceNotFoundException, InvalidCurrencyException

class PricingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.price_repo = PriceRepository(db)
        self.promo_repo = PromotionRepository(db)
        self.coupon_service = CouponService(db)

    async def get_price(self, variant_id: str) -> ProductPrice:
        price = await self.price_repo.get_by_variant_id(variant_id)
        if not price:
            raise PriceNotFoundException(variant_id)
        return price

    async def list_prices(self, skip: int = 0, limit: int = 100) -> List[ProductPrice]:
        return await self.price_repo.list_prices(skip, limit)

    async def upsert_price(self, dto: ProductPriceCreateDto) -> ProductPrice:
        return await self.price_repo.upsert_price(dto)

    async def calculate_pricing(self, request: PricingCalculateRequest) -> PricingCalculateResponse:
        currency = request.currency.upper()
        if currency not in ("USD", "EUR", "KHR", "THB", "SGD"):
            raise InvalidCurrencyException(currency)

        # 1. Authoritative price lookup - NEVER trust client prices!
        variant_ids = [item.variant_id for item in request.items]
        price_map = await self.price_repo.get_by_variant_ids(variant_ids)

        for item in request.items:
            if item.variant_id not in price_map:
                raise PriceNotFoundException(item.variant_id)

        # 2. Build initial item prices & calculate raw subtotal
        total_subtotal = Decimal("0.00")
        total_quantity = 0
        item_data: List[Dict[str, Any]] = []

        for item in request.items:
            p_record = price_map[item.variant_id]
            unit_price = DiscountEngine.round_money(p_record.sale_price if p_record.sale_price else p_record.base_price)
            line_subtotal = DiscountEngine.round_money(unit_price * item.quantity)
            total_subtotal += line_subtotal
            total_quantity += item.quantity

            item_data.append({
                "item": item,
                "product_id": item.product_id or p_record.product_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "line_subtotal": line_subtotal,
                "discount": Decimal("0.00"),
                "category_id": item.category_id,
                "brand_id": item.brand_id,
            })

        applied_promotions: List[AppliedPromotionDto] = []
        has_non_stackable = False

        # 3. Retrieve and evaluate active promotions
        active_promos = await self.promo_repo.get_active_promotions()

        for promo in active_promos:
            if has_non_stackable:
                break

            if not EligibilityService.is_promotion_active(promo):
                continue

            if not EligibilityService.evaluate_rules(promo, total_subtotal, total_quantity):
                continue

            promo_discount_total = Decimal("0.00")

            if promo.type in ("PERCENTAGE", "PRODUCT_DISCOUNT", "CATEGORY_DISCOUNT", "BUY_X_GET_Y", "FIXED_AMOUNT"):
                # Apply across targeted items
                for data in item_data:
                    if EligibilityService.is_item_targeted(
                        promo,
                        data["product_id"],
                        data["variant_id"],
                        data["category_id"],
                        data["brand_id"],
                    ):
                        remaining_line = data["line_subtotal"] - data["discount"]
                        if remaining_line > Decimal("0.00"):
                            item_disc = DiscountEngine.calculate_item_discount(
                                promo_type=promo.type,
                                discount_value=promo.discount_value,
                                unit_price=data["unit_price"],
                                quantity=data["quantity"],
                                buy_quantity=promo.buy_quantity,
                                get_quantity=promo.get_quantity,
                                max_discount_amount=promo.max_discount_amount,
                            )
                            # Ensure we don't discount more than remaining
                            actual_disc = min(item_disc, remaining_line)
                            data["discount"] += actual_disc
                            promo_discount_total += actual_disc

            elif promo.type in ("ORDER_DISCOUNT", "FREE_SHIPPING"):
                rem_order_subtotal = max(Decimal("0.00"), total_subtotal - sum(d["discount"] for d in item_data))
                order_disc = DiscountEngine.calculate_order_discount(
                    promo_type=promo.type,
                    discount_value=promo.discount_value,
                    order_subtotal=rem_order_subtotal,
                    max_discount_amount=promo.max_discount_amount,
                )
                promo_discount_total += order_disc
                # Distribute order discount proportionally across items
                if order_disc > Decimal("0.00") and rem_order_subtotal > Decimal("0.00"):
                    for data in item_data:
                        avail = data["line_subtotal"] - data["discount"]
                        if avail > Decimal("0.00"):
                            share = DiscountEngine.round_money(order_disc * (avail / rem_order_subtotal))
                            data["discount"] += min(share, avail)

            if promo_discount_total > Decimal("0.00"):
                applied_promotions.append(
                    AppliedPromotionDto(
                        promotion_id=promo.id,
                        name=promo.name,
                        code=promo.code,
                        discount=DiscountEngine.round_money(promo_discount_total),
                    )
                )
                if not promo.is_stackable:
                    has_non_stackable = True

        # 4. Coupon Validation & Application
        if request.coupon_code:
            valid, coupon_discount, coupon, msg, promo = await self.coupon_service.validate_coupon(
                code=request.coupon_code,
                user_id=request.user_id,
                cart_subtotal=total_subtotal,
                raise_on_invalid=False,
            )
            if valid and coupon_discount > Decimal("0.00"):
                # Ensure discount does not exceed remaining total
                current_discount = sum(d["discount"] for d in item_data)
                remaining_total = max(Decimal("0.00"), total_subtotal - current_discount)
                actual_coupon_discount = min(coupon_discount, remaining_total)

                if actual_coupon_discount > Decimal("0.00"):
                    applied_promotions.append(
                        AppliedPromotionDto(
                            promotion_id=promo.id if promo else coupon.promotion_id,
                            name=f"Coupon: {coupon.code}",
                            code=coupon.code,
                            discount=DiscountEngine.round_money(actual_coupon_discount),
                        )
                    )
                    # Distribute coupon discount among items with remaining balance
                    if remaining_total > Decimal("0.00"):
                        for data in item_data:
                            avail = data["line_subtotal"] - data["discount"]
                            if avail > Decimal("0.00"):
                                share = DiscountEngine.round_money(actual_coupon_discount * (avail / remaining_total))
                                data["discount"] += min(share, avail)

        # 5. Build Item Breakdowns
        items_breakdown: List[ItemPriceBreakdown] = []
        accumulated_discount = Decimal("0.00")

        for data in item_data:
            item_disc = DiscountEngine.round_money(data["discount"])
            accumulated_discount += item_disc
            final_line = max(Decimal("0.00"), data["line_subtotal"] - item_disc)
            final_unit = DiscountEngine.round_money(final_line / data["quantity"])

            items_breakdown.append(
                ItemPriceBreakdown(
                    variant_id=data["variant_id"],
                    product_id=data["product_id"],
                    quantity=data["quantity"],
                    unit_price=data["unit_price"],
                    discount=item_disc,
                    final_unit_price=final_unit,
                    subtotal=final_line,
                )
            )

        final_total = max(Decimal("0.00"), total_subtotal - accumulated_discount)

        return PricingCalculateResponse(
            currency=currency,
            subtotal=DiscountEngine.round_money(total_subtotal),
            discount=DiscountEngine.round_money(accumulated_discount),
            shipping_discount=Decimal("0.00"),
            taxable_amount=DiscountEngine.round_money(final_total),
            total=DiscountEngine.round_money(final_total),
            items=items_breakdown,
            applied_promotions=applied_promotions,
        )
