# Promotion / Pricing Service — Core Service #10

## 1. Purpose & Domain Ownership

The **Promotion / Pricing Service** determines the authoritative price a customer should pay after applying pricing rules, discounts, promotional campaigns, and coupons.

### Responsibility Boundary:
- **Catalog Service owns**: "What is the product?" (Name, SKU, Description, Category, Images).
- **Promotion / Pricing Service owns**: "How much should it cost?" (Base selling price, discounts, coupons, promotions, cart & order final calculations).
- **Payment Service owns**: "Charge money" (Credit card, Stripe, ABA PayWay).

> **Never Trust Client Prices**: Clients send only `productId`, `variantId`, and `quantity`. The service resolves authoritative prices from `product_prices` (`NUMERIC(19, 4)` / `Decimal`), ensuring zero floating-point calculation errors.

---

## 2. Technology Stack

- **Language**: Python 3.11+
- **Framework**: FastAPI (Asynchronous REST API)
- **Database**: PostgreSQL (`pricing_db` on port `5441`)
- **ORM**: SQLAlchemy 2.0 (`asyncpg` / `aiosqlite` for testing)
- **Cache**: Redis (`port 6388`)
- **Event Broker**: Kafka (`localhost:9101`, topic `promotion.events`)
- **Validation**: Pydantic v2
- **Testing**: pytest, pytest-asyncio, pytest-mock
- **Container**: Docker & Docker Compose

---

## 3. Database Schema

- `product_prices`: `id`, `product_id`, `variant_id`, `currency`, `base_price`, `sale_price`, `status`, `effective_from`, `effective_to`
- `promotions`: `id`, `name`, `code`, `type` (`PERCENTAGE`, `FIXED_AMOUNT`, `BUY_X_GET_Y`, etc.), `status` (`ACTIVE`, `PAUSED`, `EXPIRED`), `priority`, `discount_value`, `buy_quantity`, `get_quantity`, `is_stackable`, `usage_limit`, `usage_count`, `per_user_limit`, `min_order_amount`, `max_discount_amount`
- `promotion_targets`: `id`, `promotion_id`, `target_type` (`PRODUCT`, `VARIANT`, `CATEGORY`, `BRAND`), `target_id`
- `promotion_rules`: `id`, `promotion_id`, `rule_type`, `operator`, `value`
- `coupons`: `id`, `promotion_id`, `code`, `status`, `usage_limit`, `usage_count`, `per_user_limit`, `expires_at`
- `promotion_usages`: `id`, `promotion_id`, `coupon_id`, `user_id`, `order_id`, `discount_amount`, `used_at`
- `outbox_events`: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status` (`PENDING`, `PUBLISHED`, `FAILED`)

---

## 4. Concurrency Protection on Coupon Limits

To prevent race conditions when hundreds of users check out concurrently with limited coupons (e.g. limit 100):
```sql
UPDATE coupons
SET usage_count = usage_count + 1
WHERE id = :id
  AND status = 'ACTIVE'
  AND (usage_limit IS NULL OR usage_count < usage_limit);
```
If affected rows = 1, redemption is guaranteed. If affected rows = 0, `COUPON_USAGE_LIMIT_REACHED` is returned.

---

## 5. API Reference

### Pricing Calculation
- `POST /api/v1/pricing/calculate`
  ```json
  {
    "userId": "user-123",
    "currency": "USD",
    "items": [
      {
        "productId": "prod-001",
        "variantId": "var-001",
        "quantity": 2
      }
    ],
    "couponCode": "SAVE20NOW"
  }
  ```
  Response:
  ```json
  {
    "currency": "USD",
    "subtotal": 200.00,
    "discount": 40.00,
    "shippingDiscount": 0.00,
    "taxableAmount": 160.00,
    "total": 160.00,
    "items": [
      {
        "variantId": "var-001",
        "productId": "prod-001",
        "quantity": 2,
        "unitPrice": 100.00,
        "discount": 20.00,
        "finalUnitPrice": 80.00,
        "subtotal": 160.00
      }
    ],
    "appliedPromotions": [
      {
        "promotionId": "promo-uuid",
        "name": "Coupon: SAVE20NOW",
        "code": "SAVE20NOW",
        "discount": 40.00
      }
    ]
  }
  ```

### Price Management
- `GET /api/v1/prices/{variant_id}`
- `GET /api/v1/prices`
- `POST /api/v1/prices`

### Promotions
- `POST /api/v1/promotions` (Admin)
- `GET /api/v1/promotions/{id}`
- `GET /api/v1/promotions`
- `PATCH /api/v1/promotions/{id}` (Admin)
- `POST /api/v1/promotions/{id}/activate` (Admin)
- `POST /api/v1/promotions/{id}/pause` (Admin)
- `POST /api/v1/promotions/{id}/cancel` (Admin)

### Coupons
- `POST /api/v1/coupons` (Admin)
- `GET /api/v1/coupons/{id}`
- `POST /api/v1/coupons/validate`
- `POST /api/v1/coupons/record-usage`

### Health & Monitoring
- `GET /health`
- `GET /metrics` (Prometheus)
- `GET /docs` (Swagger UI)

---

## 6. Running and Testing Locally

### Run Tests:
```bash
cd promotion-pricing-service
.venv/bin/pytest -v
```

### Start Service:
```bash
docker-compose up -d
# Or run with uvicorn:
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload
```
