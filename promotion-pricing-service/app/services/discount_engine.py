from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional, Tuple

class DiscountEngine:
    @staticmethod
    def round_money(amount: Decimal) -> Decimal:
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_item_discount(
        cls,
        promo_type: str,
        discount_value: Decimal,
        unit_price: Decimal,
        quantity: int,
        buy_quantity: Optional[int] = None,
        get_quantity: Optional[int] = None,
        max_discount_amount: Optional[Decimal] = None,
    ) -> Decimal:
        item_subtotal = cls.round_money(unit_price * quantity)
        discount = Decimal("0.00")

        if promo_type in ("PERCENTAGE", "PRODUCT_DISCOUNT", "CATEGORY_DISCOUNT"):
            # discount_value is percentage (e.g. 20 for 20%)
            raw_discount = item_subtotal * (discount_value / Decimal("100"))
            discount = cls.round_money(raw_discount)
        elif promo_type == "FIXED_AMOUNT":
            # discount_value is fixed per unit or fixed total
            discount = min(item_subtotal, cls.round_money(discount_value))
        elif promo_type == "BUY_X_GET_Y":
            buy_qty = buy_quantity or 1
            get_qty = get_quantity or 1
            set_size = buy_qty + get_qty
            if set_size > 0:
                full_sets = quantity // set_size
                remainder = quantity % set_size
                free_items = full_sets * get_qty
                if remainder > buy_qty:
                    free_items += (remainder - buy_qty)
                discount = cls.round_money(Decimal(free_items) * unit_price)

        if max_discount_amount is not None and max_discount_amount > Decimal("0.00"):
            discount = min(discount, cls.round_money(max_discount_amount))

        return min(discount, item_subtotal)

    @classmethod
    def calculate_order_discount(
        cls,
        promo_type: str,
        discount_value: Decimal,
        order_subtotal: Decimal,
        max_discount_amount: Optional[Decimal] = None,
    ) -> Decimal:
        discount = Decimal("0.00")
        if promo_type in ("PERCENTAGE", "ORDER_DISCOUNT"):
            raw_discount = order_subtotal * (discount_value / Decimal("100"))
            discount = cls.round_money(raw_discount)
        elif promo_type == "FIXED_AMOUNT":
            discount = min(order_subtotal, cls.round_money(discount_value))

        if max_discount_amount is not None and max_discount_amount > Decimal("0.00"):
            discount = min(discount, cls.round_money(max_discount_amount))

        return min(discount, order_subtotal)
