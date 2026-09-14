from decimal import Decimal
import pytest
from httpx import AsyncClient, ASGITransport
import jwt
from app.main import app
from app.db.database import get_db

@pytest.mark.asyncio
async def test_stackability_and_priority(client: AsyncClient):
    # Base price $100
    await client.post(
        "/api/v1/prices",
        json={
            "productId": "prod-stack",
            "variantId": "var-stack-1",
            "currency": "USD",
            "basePrice": "100.00",
            "status": "ACTIVE",
        },
    )

    # High-priority Non-stackable promo: 30% off (Priority 100)
    await client.post(
        "/api/v1/promotions",
        json={
            "name": "High Priority 30% Off",
            "type": "PERCENTAGE",
            "discountValue": "30.00",
            "priority": 100,
            "isStackable": False,
            "targets": [{"targetType": "VARIANT", "targetId": "var-stack-1"}],
        },
    )

    # Lower-priority promo: $20 off (Priority 50)
    await client.post(
        "/api/v1/promotions",
        json={
            "name": "Lower Priority $20 Off",
            "type": "FIXED_AMOUNT",
            "discountValue": "20.00",
            "priority": 50,
            "isStackable": True,
            "targets": [{"targetType": "VARIANT", "targetId": "var-stack-1"}],
        },
    )

    # Calculation: Only the 30% promotion should apply because it's non-stackable!
    calc = await client.post(
        "/api/v1/pricing/calculate",
        json={
            "currency": "USD",
            "items": [{"productId": "prod-stack", "variantId": "var-stack-1", "quantity": 1}],
        },
    )
    assert calc.status_code == 200
    data = calc.json()
    assert Decimal(str(data["subtotal"])) == Decimal("100.00")
    assert Decimal(str(data["discount"])) == Decimal("30.00")
    assert Decimal(str(data["total"])) == Decimal("70.00")
    assert len(data["appliedPromotions"]) == 1
    assert data["appliedPromotions"][0]["name"] == "High Priority 30% Off"

@pytest.mark.asyncio
async def test_admin_authorization_enforcement(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Customer token (not ADMIN)
    customer_token = jwt.encode(
        {"sub": "cust-1", "role": "CUSTOMER"},
        "supersecretjwtkeyforpromotionandpricingservice2026test",
        algorithm="HS256",
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {customer_token}"},
    ) as cust_client:
        # Customer cannot create promotion
        promo_res = await cust_client.post(
            "/api/v1/promotions",
            json={
                "name": "Hacked Promo",
                "type": "PERCENTAGE",
                "discountValue": "99.00",
            },
        )
        assert promo_res.status_code == 403
        assert promo_res.json()["errorCode"] == "UNAUTHORIZED_OPERATION"

        # Customer cannot view admin reports
        admin_res = await cust_client.get("/api/v1/admin/promotions")
        assert admin_res.status_code == 403

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_currency_validation(client: AsyncClient):
    res = await client.post(
        "/api/v1/pricing/calculate",
        json={
            "currency": "BITCOIN",
            "items": [{"variantId": "any", "quantity": 1}],
        },
    )
    assert res.status_code == 400
    assert res.json()["errorCode"] == "INVALID_CURRENCY"
