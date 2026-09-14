from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional
from app.models.promotion import Promotion

class EligibilityService:
    @staticmethod
    def is_promotion_active(promo: Promotion, current_time: Optional[datetime] = None) -> bool:
        if promo.status != "ACTIVE":
            return False

        now = current_time or datetime.now(timezone.utc)
        if promo.start_at and now < promo.start_at:
            return False
        if promo.end_at and now > promo.end_at:
            return False

        if promo.usage_limit is not None and promo.usage_count >= promo.usage_limit:
            return False

        return True

    @staticmethod
    def is_item_targeted(
        promo: Promotion,
        product_id: Optional[str],
        variant_id: str,
        category_id: Optional[str] = None,
        brand_id: Optional[str] = None,
    ) -> bool:
        if not promo.targets:
            # If no specific targets, applies to all items unless restricted by rules
            return True

        for target in promo.targets:
            t_type = target.target_type.upper()
            t_id = target.target_id

            if t_type == "VARIANT" and t_id == variant_id:
                return True
            if t_type == "PRODUCT" and product_id and t_id == product_id:
                return True
            if t_type == "CATEGORY" and category_id and t_id == category_id:
                return True
            if t_type == "BRAND" and brand_id and t_id == brand_id:
                return True
            if t_type == "ORDER":
                return True

        return False

    @staticmethod
    def evaluate_rules(promo: Promotion, subtotal: Decimal, total_quantity: int) -> bool:
        if promo.min_order_amount is not None and subtotal < promo.min_order_amount:
            return False

        for rule in promo.rules:
            r_type = rule.rule_type.upper()
            op = rule.operator.upper()
            val = rule.value

            if r_type == "MIN_ORDER_AMOUNT":
                target_val = Decimal(val)
                if op in ("GREATER_THAN_OR_EQUAL", "GTE") and subtotal < target_val:
                    return False
                if op in ("GREATER_THAN", "GT") and subtotal <= target_val:
                    return False
            elif r_type == "MIN_QUANTITY":
                target_qty = int(val)
                if op in ("GREATER_THAN_OR_EQUAL", "GTE") and total_quantity < target_qty:
                    return False
                if op in ("GREATER_THAN", "GT") and total_quantity <= target_qty:
                    return False

        return True
