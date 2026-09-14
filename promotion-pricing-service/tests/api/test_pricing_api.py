from decimal import Decimal
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pricing_lifecycle_and_calculations(client: AsyncClient):
    # 1. Seed base product price
    price_res = await client.post(
        "/api/v1/prices",
        json={
            "productId": "prod-101",
            "variantId": "var-201",
            "currency": "USD",
            "basePrice": "100.00",
            "status": "ACTIVE",
        },
    )
    assert price_res.status_code == 200
    price_data = price_res.json()
    assert price_data["variantId"] == "var-201"
    assert Decimal(str(price_data["basePrice"])) == Decimal("100.00")

    # 2. Calculate price with NO promotions active
    calc_res = await client.post(
        "/api/v1/pricing/calculate",
        json={
            "userId": "user-123",
            "currency": "USD",
            "items": [
                {
                    "productId": "prod-101",
                    "variantId": "var-201",
                    "quantity": 2,
                    "unitPrice": 10.00, # Client attempts to tamper - MUST BE IGNORED!
                }
            ],
        },
    )
    assert calc_res.status_code == 200
    calc_data = calc_res.json()
    assert Decimal(str(calc_data["subtotal"])) == Decimal("200.00")
    assert Decimal(str(calc_data["discount"])) == Decimal("0.00")
    assert Decimal(str(calc_data["total"])) == Decimal("200.00")
    assert len(calc_data["items"]) == 1
    assert Decimal(str(calc_data["items"][0]["unitPrice"])) == Decimal("100.00")

    # 3. Create a 20% OFF Promotion targeting category or variant
    promo_res = await client.post(
        "/api/v1/promotions",
        json={
            "name": "Electronics 20% Off",
            "code": "ELECTRO20",
            "type": "PERCENTAGE",
            "discountValue": "20.00",
            "priority": 10,
            "isStackable": True,
            "targets": [
                {"targetType": "VARIANT", "targetId": "var-201"}
            ],
        },
    )
    assert promo_res.status_code == 201
    promo_id = promo_res.json()["id"]

    # 4. Calculate price with Active 20% Promotion
    # Base: $100 x 2 = $200. Discount 20% = $40. Total = $160.
    calc_res_2 = await client.post(
        "/api/v1/pricing/calculate",
        json={
            "userId": "user-123",
            "currency": "USD",
            "items": [
                {
                    "productId": "prod-101",
                    "variantId": "var-201",
                    "quantity": 2,
                }
            ],
        },
    )
    assert calc_res_2.status_code == 200
    calc_data_2 = calc_res_2.json()
    assert Decimal(str(calc_data_2["subtotal"])) == Decimal("200.00")
    assert Decimal(str(calc_data_2["discount"])) == Decimal("40.00")
    assert Decimal(str(calc_data_2["total"])) == Decimal("160.00")
    assert len(calc_data_2["appliedPromotions"]) == 1
    assert calc_data_2["appliedPromotions"][0]["name"] == "Electronics 20% Off"

    # 5. Create and validate a Coupon
    coupon_res = await client.post(
        "/api/v1/coupons",
        json={
            "promotionId": promo_id,
            "code": "SAVE20NOW",
            "usageLimit": 2,
            "perUserLimit": 1,
        },
    )
    assert coupon_res.status_code == 201

    validate_res = await client.post(
        "/api/v1/coupons/validate",
        json={
            "code": "SAVE20NOW",
            "userId": "user-123",
            "items": [{"variantId": "var-201", "quantity": 2}],
        },
    )
    assert validate_res.status_code == 200
    val_data = validate_res.json()
    assert val_data["valid"] is True
    assert val_data["code"] == "SAVE20NOW"

    # 6. Record coupon usage and verify limits
    use_res1 = await client.post(
        "/api/v1/coupons/record-usage",
        json={
            "code": "SAVE20NOW",
            "userId": "user-123",
            "orderId": "order-001",
            "discountAmount": "40.00",
        },
    )
    assert use_res1.status_code == 200

    # User-limit check: user-123 cannot reuse with perUserLimit=1
    val_again = await client.post(
        "/api/v1/coupons/validate",
        json={
            "code": "SAVE20NOW",
            "userId": "user-123",
            "items": [{"variantId": "var-201", "quantity": 1}],
        },
    )
    assert val_again.json()["valid"] is False

    # 7. Promotion state transition: Pause
    pause_res = await client.post(f"/api/v1/promotions/{promo_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"

    # 8. Check health endpoint
    health_res = await client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "UP"

    # 9. Missing price check
    missing_res = await client.post(
        "/api/v1/pricing/calculate",
        json={
            "currency": "USD",
            "items": [{"variantId": "non-existent-var", "quantity": 1}],
        },
    )
    assert missing_res.status_code == 404
    assert missing_res.json()["errorCode"] == "PRICE_NOT_FOUND"
