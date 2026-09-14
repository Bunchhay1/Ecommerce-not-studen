from decimal import Decimal
import pytest
from app.services.discount_engine import DiscountEngine

def test_percentage_discount_basic():
    # 20% on unit price $100, qty 2 => subtotal $200 => discount $40
    disc = DiscountEngine.calculate_item_discount(
        promo_type="PERCENTAGE",
        discount_value=Decimal("20.00"),
        unit_price=Decimal("100.00"),
        quantity=2,
    )
    assert disc == Decimal("40.00")

def test_percentage_discount_with_max_cap():
    # 20% on $500 = $100, but capped at $50
    disc = DiscountEngine.calculate_item_discount(
        promo_type="PERCENTAGE",
        discount_value=Decimal("20.00"),
        unit_price=Decimal("500.00"),
        quantity=1,
        max_discount_amount=Decimal("50.00"),
    )
    assert disc == Decimal("50.00")

def test_fixed_amount_discount():
    # $20 off item subtotal $100 => discount $20
    disc = DiscountEngine.calculate_item_discount(
        promo_type="FIXED_AMOUNT",
        discount_value=Decimal("20.00"),
        unit_price=Decimal("100.00"),
        quantity=1,
    )
    assert disc == Decimal("20.00")

def test_fixed_amount_discount_does_not_exceed_subtotal():
    # $150 off item subtotal $100 => discount capped at $100
    disc = DiscountEngine.calculate_item_discount(
        promo_type="FIXED_AMOUNT",
        discount_value=Decimal("150.00"),
        unit_price=Decimal("50.00"),
        quantity=2,
    )
    assert disc == Decimal("100.00")

def test_buy_x_get_y_discount():
    # Buy 2 Get 1 Free, unit price $30.00
    # Buy 3 items => 1 free item => discount $30.00
    disc = DiscountEngine.calculate_item_discount(
        promo_type="BUY_X_GET_Y",
        discount_value=Decimal("0.00"),
        unit_price=Decimal("30.00"),
        quantity=3,
        buy_quantity=2,
        get_quantity=1,
    )
    assert disc == Decimal("30.00")

    # Buy 6 items => 2 free items => discount $60.00
    disc6 = DiscountEngine.calculate_item_discount(
        promo_type="BUY_X_GET_Y",
        discount_value=Decimal("0.00"),
        unit_price=Decimal("30.00"),
        quantity=6,
        buy_quantity=2,
        get_quantity=1,
    )
    assert disc6 == Decimal("60.00")

    # Buy 2 items (not enough for free item) => discount $0
    disc2 = DiscountEngine.calculate_item_discount(
        promo_type="BUY_X_GET_Y",
        discount_value=Decimal("0.00"),
        unit_price=Decimal("30.00"),
        quantity=2,
        buy_quantity=2,
        get_quantity=1,
    )
    assert disc2 == Decimal("0.00")
