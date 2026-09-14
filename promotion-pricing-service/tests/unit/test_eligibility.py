from datetime import datetime, timedelta, timezone
from decimal import Decimal
from app.models.promotion import Promotion
from app.models.promotion_target import PromotionTarget
from app.models.promotion_rule import PromotionRule
from app.services.eligibility_service import EligibilityService

def test_promotion_status_and_dates():
    now = datetime.now(timezone.utc)
    active_promo = Promotion(
        id="p1",
        name="Summer Sale",
        type="PERCENTAGE",
        status="ACTIVE",
        discount_value=Decimal("10.00"),
        start_at=now - timedelta(days=1),
        end_at=now + timedelta(days=1),
    )
    assert EligibilityService.is_promotion_active(active_promo, now) is True

    expired_promo = Promotion(
        id="p2",
        name="Expired Sale",
        type="PERCENTAGE",
        status="ACTIVE",
        discount_value=Decimal("10.00"),
        start_at=now - timedelta(days=5),
        end_at=now - timedelta(days=1),
    )
    assert EligibilityService.is_promotion_active(expired_promo, now) is False

    draft_promo = Promotion(
        id="p3",
        name="Draft Sale",
        type="PERCENTAGE",
        status="DRAFT",
        discount_value=Decimal("10.00"),
    )
    assert EligibilityService.is_promotion_active(draft_promo, now) is False

def test_target_matching():
    promo = Promotion(
        id="p4",
        name="Phone Sale",
        type="PERCENTAGE",
        status="ACTIVE",
        discount_value=Decimal("15.00"),
    )
    target = PromotionTarget(target_type="CATEGORY", target_id="smartphones")
    promo.targets = [target]

    assert EligibilityService.is_item_targeted(promo, "p1", "v1", category_id="smartphones") is True
    assert EligibilityService.is_item_targeted(promo, "p2", "v2", category_id="books") is False

def test_rule_evaluation():
    promo = Promotion(
        id="p5",
        name="Min Order $100",
        type="FIXED_AMOUNT",
        status="ACTIVE",
        discount_value=Decimal("10.00"),
        min_order_amount=Decimal("100.00"),
    )
    rule = PromotionRule(
        rule_type="MIN_ORDER_AMOUNT",
        operator="GREATER_THAN_OR_EQUAL",
        value="100.00",
    )
    promo.rules = [rule]

    # Subtotal $80 => ineligible
    assert EligibilityService.evaluate_rules(promo, Decimal("80.00"), 1) is False
    # Subtotal $150 => eligible
    assert EligibilityService.evaluate_rules(promo, Decimal("150.00"), 2) is True
