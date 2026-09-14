# E-Commerce Microservices — Service Communication Documentation

The most important rule is:
> **Frontend communicates with API Gateway. Backend services communicate with each other through REST/gRPC when an immediate response is required, and Kafka events when communication can be asynchronous. Services never access another service's database directly.**

---

## 1. Complete Architecture

```
                           ACTORS / EXPERIENCES
           ┌──────────────────────┬──────────────────────┐
           ▼                      ▼                      ▼
       Customers               Sellers             Administrators
    Web / Mobile App        Merchant Portal         Control Plane
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │ HTTPS
                                  ▼
                       ┌─────────────────────┐
                       │  NEXT.JS FRONTEND   │
                       │ Next.js + TypeScript│
                       │ Tailwind + shadcn   │
                       │ Zustand + Motion    │
                       └──────────┬──────────┘
                                  │
                                  │ HTTPS / REST
                                  ▼
                       ┌─────────────────────┐
                       │    API GATEWAY      │
                       │     Go + Fiber      │
                       │      Port 8000      │
                       └──────────┬──────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              │                       │                        │
              ▼                       ▼                        ▼
        ┌───────────┐          ┌───────────┐            ┌───────────┐
        │   Auth    │          │   User    │            │  Catalog  │
        │    #01    │          │    #02    │            │    #03    │
        └───────────┘          └───────────┘            └───────────┘
              │                       │                        │
              ▼                       ▼                        ▼
        ┌───────────┐          ┌───────────┐            ┌───────────┐
        │  Search   │          │   Cart    │            │ Inventory │
        │    #04    │          │    #05    │            │    #06    │
        └───────────┘          └───────────┘            └───────────┘
              │                       │                        │
              ▼                       ▼                        ▼
        ┌───────────┐          ┌───────────┐            ┌───────────┐
        │   Order   │          │  Payment  │            │ Shipping  │
        │    #07    │          │    #08    │            │    #09    │
        └───────────┘          └───────────┘            └───────────┘
              │                       │                        │
              ▼                       ▼                        ▼
        ┌───────────┐          ┌───────────┐            ┌───────────┐
        │  Pricing  │          │  Review   │            │Notification│
        │    #10    │          │    #11    │            │    #12    │
        └───────────┘          └───────────┘            └───────────┘
              │                       │                        │
              ▼                       ▼                        ▼
        ┌──────────────┐       ┌───────────┐            ┌───────────┐
        │Recommendation│       │  Seller   │            │   Admin   │
        │     #13      │       │    #14    │            │    #15    │
        └──────────────┘       └───────────┘            └───────────┘

                    ┌──────────────────────────┐
                    │         KAFKA            │
                    │      Event Backbone      │
                    └──────────────────────────┘
```

---

## 2. Communication Types

Your architecture should use three main communication methods:

| Communication | Use for | Example |
| :--- | :--- | :--- |
| **REST/HTTP** | Immediate request/response | Get product |
| **Kafka** | Asynchronous events | ProductUpdated |
| **Redis** | Cache/temporary coordination | Cached product |
| **Database** | Own service only | Catalog → catalog_db |

### Rule

```
Immediate answer needed?
        │
       YES
        ▼
   REST / HTTP

Can happen asynchronously?
        │
       YES
        ▼
       Kafka

Need cached/temporary data?
        │
       YES
        ▼
      Redis
```

---

## 3. Very Important Database Rule

Every service owns its database.

```
Catalog Service
      │
      ▼
 catalog_db

Order Service
      │
      ▼
 order_db

Payment Service
      │
      ▼
 payment_db
```

### Never:
```
Order Service
      │
      └──────X──────> payment_db
```

### Instead:
```
Order Service
      │
      │ REST
      ▼
Payment Service
      │
      ▼
 payment_db
```

---

## 4. Service Communication Matrix

Here is the main communication map:

| Service | Communicates with | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth** | User | Kafka/REST | Identity/profile coordination |
| **User** | Auth | REST | Authentication-related user context when needed |
| **Catalog** | Search | Kafka | Product indexing |
| **Catalog** | Pricing | Kafka/REST | Product/variant information |
| **Catalog** | Review | Kafka | Product lifecycle changes |
| **Catalog** | Recommendation | Kafka | Product data/events |
| **Cart** | Catalog | REST | Product/variant validation |
| **Cart** | Pricing | REST | Current price |
| **Cart** | Inventory | REST | Availability check |
| **Cart** | Order | REST | Checkout conversion |
| **Inventory** | Order | REST/Kafka | Reservation + stock events |
| **Order** | Cart | REST | Get/convert cart |
| **Order** | Pricing | REST | Recalculate checkout |
| **Order** | Inventory | REST | Reserve/release/confirm stock |
| **Order** | Payment | REST/Kafka | Payment |
| **Order** | Shipping | REST/Kafka | Shipment creation |
| **Order** | User | REST | Address/profile data when required |
| **Payment** | Order | REST/Kafka | Payment result |
| **Shipping** | Order | REST/Kafka | Delivery status |
| **Pricing** | Catalog | REST/Kafka | Product context |
| **Review** | Order | REST/Kafka | Purchase verification |
| **Review** | Catalog | Kafka | Product lifecycle |
| **Notification** | Kafka | Kafka | Consume business events |
| **Recommendation** | Kafka | Kafka | User/product behavior |
| **Seller** | Catalog | REST/Kafka | Product/listing relationship |
| **Seller** | Inventory | REST/Kafka | Seller stock |
| **Seller** | Order | Kafka/REST | Seller order information |
| **Admin** | All business services | REST/Kafka | Administration |

---

## 5. Auth Service Communication

### Auth → User
When registration succeeds:

```
Client
  │
  ▼
Gateway
  │
  ▼
Auth
  │
  ├── Create authentication identity
  │
  └── UserRegistered
          │
          ▼
        Kafka
          │
          ▼
        User
```

#### Event:
```json
{
  "eventId": "evt-123",
  "eventType": "UserRegistered",
  "userId": "user-123",
  "email": "user@example.com",
  "timestamp": "2026-09-14T01:00:00Z"
}
```

User Service then creates the profile.

### Important Ownership Separation

**Auth owns:**
- `email`
- `password`
- `credentials`
- `roles`
- `authentication`

**User owns:**
- `name`
- `phone`
- `avatar`
- `addresses`
- `preferences`

---

## 6. Catalog → Search

This should primarily be Kafka.

```
Catalog
   │
   │ ProductCreated
   ▼
 Kafka
   │
   ▼
 Search
   │
   ▼
 OpenSearch
```

### Events:
- `ProductCreated`
- `ProductUpdated`
- `ProductDeleted`
- `ProductActivated`
- `ProductArchived`
- `CategoryCreated`
- `CategoryUpdated`
- `BrandCreated`
- `BrandUpdated`

This means Search does **not** need:
`Search → catalog_db`

---

## 7. Catalog → Pricing

Pricing needs product/variant context.

### Recommended:
```
Catalog
   │
   │ Product/Variant events
   ▼
 Kafka
   │
   ▼
Pricing
```

For an immediate lookup, Pricing may call Catalog's API if necessary:
```
Pricing
   │
   │ GET product/variant
   ▼
Catalog
```

> **Note:** Don't make Pricing call Catalog for every price calculation if you can avoid it. At scale:
> `Catalog → Kafka → Pricing local data/cache` is better.

---

## 8. Catalog → Review

When a product is deleted:

```
Catalog
   │
   │ ProductDeleted
   ▼
 Kafka
   │
   ▼
Review
```

Review can then transition status:
`PUBLISHED → HIDDEN`
or archive the associated reviews.

**No:**
`Review → catalog_db`

---

## 9. Catalog → Recommendation

Catalog publishes product events:
- `ProductCreated`
- `ProductUpdated`
- `ProductActivated`
- `ProductArchived`

Recommendation consumes them:
```
Catalog
   │
   ▼
 Kafka
   │
   ▼
Recommendation
```
This helps the recommendation engine know which products are active.

---

## 10. Cart Communication

Cart normally communicates with:
- Catalog
- Pricing
- Inventory
- Order

### Add Product Flow
```
Frontend
   │
   ▼
Gateway
   │
   ▼
 Cart
   │
   ├──── REST ────> Catalog
   │
   └──── REST ────> Pricing
```

**Catalog confirms:**
- Product exists
- Variant exists
- Variant is purchasable

**Pricing confirms:**
- Current price
- Currency
- Applicable discount

---

## 11. Cart → Inventory

When displaying availability:

```
Cart
  │
  │ GET/check availability
  ▼
Inventory
```

### Important Rule:
Adding something to the cart should normally **not** reserve inventory permanently.

**Correct:**
```
Add to Cart
     │
     ▼
No permanent reservation
     │
     ▼
 Checkout
     │
     ▼
Inventory Reservation
```
This prevents abandoned carts from locking your inventory.

---

## 12. Cart → Order

At checkout:

```
Frontend
   │
   ▼
Gateway
   │
   ▼
 Order
   │
   │ get/convert cart
   ▼
  Cart
```

Order can obtain the authoritative cart contents, then Order starts checkout.

---

## 13. Order Service — Main Communication Hub

The Order Service is one of the most important services. It communicates with:
- Cart
- Pricing
- Inventory
- Payment
- Shipping
- User

### Main Flow:
```
                  ┌───────────┐
                  │   Cart    │
                  └─────┬─────┘
                        │
                        ▼
                   ┌─────────┐
                   │  Order  │
                   └────┬────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Pricing      Inventory       Payment
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                    Shipping
```

---

## 14. Checkout Communication

This is the most important communication flow in the whole system.

```
Customer
   │
   │ POST /orders
   ▼
Frontend
   │
   ▼
API Gateway
   │
   ▼
Order Service
   │
   ├──── REST ────> Cart
   │
   ├──── REST ────> Pricing
   │
   ├──── REST ────> Inventory
   │
   └──── REST ────> Payment
```

Then:
```
Payment Success
      │
      ▼
    Kafka
      │
      ▼
    Order
      │
      ▼
Inventory Confirm
      │
      ▼
Shipping Create
```

---

## 15. Order → Pricing

Order must revalidate pricing during checkout.

```
Order
  │
  │ POST /pricing/calculate
  ▼
Pricing
```

### Important:
$$\text{Frontend price} \neq \text{Authoritative order price}$$

The Order Service should use the trusted Pricing response. Then Order stores:
- `unit_price`
- `discount`
- `subtotal`
- `shipping_fee`
- `tax`
- `total`

as a snapshot.

---

## 16. Order → Inventory

This is synchronous because Order needs to know whether stock can be reserved.

```
Order
  │
  │ POST /inventory/reservations
  ▼
Inventory
```

**Success:**
```
Inventory
   │
   ▼
Reservation created
   │
   ▼
Order continues
```

**Failure:**
```
Inventory
   │
   ▼
INSUFFICIENT_STOCK
   │
   ▼
Order FAILED
```

---

## 17. Order → Payment

Order asks Payment Service to create/authorize payment.

```
Order
   │
   │ POST /payments/intents
   ▼
Payment
```

Payment Service talks to the external provider:
```
Payment Service
      │
      ▼
Payment Provider
```

**Never:**
```
Frontend
   │
   └──> Payment Provider
```
for your own business-order state management.

---

## 18. Payment → Order

Payment results should be delivered through Kafka/webhook processing.

```
Payment Provider
       │
       ▼
Payment Service
       │
       │ PaymentSucceeded
       ▼
     Kafka
       │
       ▼
Order Service
```

### Events:
- `PaymentCreated`
- `PaymentAuthorized`
- `PaymentCaptured`
- `PaymentFailed`
- `PaymentCancelled`
- `PaymentRefunded`

---

## 19. Payment Webhook Flow

External payment provider:

```
Payment Provider
       │
       │ Webhook
       ▼
Payment Service
       │
       ├── Verify signature
       ├── Check idempotency
       ├── Update payment_db
       │
       ▼
     Kafka
       │
       ▼
Order Service
```

This is safer than trusting the browser to tell your backend: *"Payment succeeded."*

---

## 20. Inventory Communication

Inventory communicates mainly with:
- Order
- Seller
- Catalog

### Reservation Flow:
```
Order
  │
  │ REST
  ▼
Inventory
```

Reservation confirmed:
```
Inventory
   │
   │ StockReserved
   ▼
 Kafka
```
Other services can consume this event.

---

## 21. Inventory Events

### Recommended Events:
- `StockAdded`
- `StockAdjusted`
- `StockReserved`
- `StockReleased`
- `StockConfirmed`
- `StockLow`
- `StockOut`

### Example Fan-out:
```
Inventory
   │
   │ StockLow
   ▼
 Kafka
   │
   ├────> Notification
   ├────> Seller
   └────> Admin
```
This is a prime example of Kafka's value.

---

## 22. Shipping Communication

Order tells Shipping when an order is ready.

```
Order
   │
   │ OrderPaid / OrderProcessing
   ▼
 Kafka
   │
   ▼
Shipping
```

Or when immediate shipment creation is required:
```
Order
   │
   │ POST /shipping/shipments
   ▼
Shipping
```

Shipping then talks to the carrier:
```
Shipping
   │
   ▼
Carrier API
```

---

## 23. Shipping → Order

When shipping status changes:

```
Carrier
   │
   ▼
Shipping
   │
   │ ShipmentDelivered
   ▼
 Kafka
   │
   ▼
 Order
```

Order updates:
$$\text{SHIPPED} \longrightarrow \text{DELIVERED} \longrightarrow \text{COMPLETED}$$

---

## 24. User → Order

Order may need a customer's shipping address. However, don't make Order depend on a live User address after the order is created.

At checkout:
```
Order
   │
   │ GET /users/me/addresses/{id}
   ▼
 User
```

Then Order stores an address snapshot in `order_addresses`.

### Example:
```
Customer changes address later
         │
         ▼
    User Service
         │
         X (No impact)
         │
         ▼
Old Order remains unchanged
```
This is extremely important for auditability and compliance.

---

## 25. Review → Order

Review needs to know whether the customer purchased the product.

### Recommended Architecture:
```
Order
   │
   │ OrderCompleted / OrderDelivered
   ▼
 Kafka
   │
   ▼
Review
   │
   ▼
review_purchase_eligibility
```

Then when customer posts review:
```
Customer
   │
   ▼
POST /reviews
   │
   ▼
Review Service
   │
   ▼
Check local eligibility
```
This avoids calling Order for every review request.

---

## 26. Review → Search

When a review changes the rating:

```
Review
   │
   │ RatingUpdated
   ▼
 Kafka
   │
   ▼
 Search
   │
   ▼
OpenSearch
```

Search can then index:
- `average_rating`
- `review_count`

### Example Search Result:
```json
{
  "productId": "p123",
  "name": "iPhone",
  "averageRating": 4.8,
  "reviewCount": 1250
}
```

---

## 27. Review → Notification

```
Customer submits review
       │
       ▼
Review Service
       │
       │ ReviewPublished
       ▼
     Kafka
       │
       ▼
 Notification
       │
       ▼
Seller notification
```

---

## 28. Promotion/Pricing Communication

Pricing communicates with:
- Catalog
- Order
- Cart
- Seller

### Cart Calculation:
```
Cart
  │
  │ Calculate price
  ▼
Pricing
```

### Order Recalculation:
```
Order
  │
  │ Recalculate
  ▼
Pricing
```

### Catalog Events:
```
Catalog
  │
  ▼
Kafka
  │
  ▼
Pricing
```
Pricing can maintain the product/variant information it needs without accessing `catalog_db`.

---

## 29. Recommendation Communication

Recommendation should be primarily event-driven. It consumes:
- `ProductViewed`
- `SearchPerformed`
- `CartItemAdded`
- `CartItemRemoved`
- `OrderCreated`
- `OrderCompleted`
- `ReviewCreated`
- `ProductUpdated`

### Architecture:
```
                     Kafka
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
     Order            Cart            Search
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                Recommendation
                       │
                       ▼
                     Model
                       │
                       ▼
                     Redis
```

Frontend fetches:
`GET /api/v1/recommendations/home` through Gateway.

---

## 30. Seller Communication

Seller Service needs information from:
- Catalog
- Inventory
- Order
- Review
- Pricing

(but not necessarily all synchronously).

### Product Listing:
```
Seller
   │
   │ productId / variantId
   ▼
Catalog
```
Catalog confirms the product exists.

### Inventory:
Seller can request stock adjustment:
```
Seller
   │
   ▼
Inventory
```
Inventory remains the source of truth.

### Orders:
Seller can consume:
- `OrderCreated`
- `OrderPaid`
- `OrderCancelled`
- `OrderCompleted`
through Kafka.

---

## 31. Seller → Pricing

A seller may create/update an offer:

```
Seller
   │
   │ OfferCreated
   ▼
 Kafka
   │
   ▼
Pricing
```

### Architectural Choice for Multi-Seller Marketplace:
```
Product
   │
   ├── Seller A → $100
   ├── Seller B → $95
   └── Seller C → $110
```
The Seller/Marketplace Service should own the seller listing/offer relationship, while Pricing owns the pricing rules/calculation.
**Don't duplicate seller ownership inside Catalog.**

---

## 32. Notification Service

Notification is mostly an event consumer.

```
             Kafka
                │
    ┌───────────┼────────────┐
    ▼           ▼            ▼
  Order       Payment      Shipping
    │           │            │
    └───────────┼────────────┘
                ▼
          Notification
                │
       ┌────────┼─────────┐
       ▼        ▼         ▼
     Email     SMS       Push
```

### Examples:
- `OrderPaid` $\longrightarrow$ Payment confirmation
- `OrderShipped` $\longrightarrow$ Shipping notification
- `OrderDelivered` $\longrightarrow$ Delivery notification
- `PaymentFailed` $\longrightarrow$ Payment failure notification
- `StockLow` $\longrightarrow$ Seller notification

Notification should **not** call Order DB.

---

## 33. Admin Communication

Admin is different. Admin is a control plane, not the owner of business data.

```
                  Admin Frontend
                        │
                        ▼
                   API Gateway
                        │
                        ▼
                  Admin Service
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
     Order            Seller           Catalog
       │                │                │
       ▼                ▼                ▼
    Payment          Inventory         Review
```

### Example: Admin refunds order
```
Admin Frontend
      │
      ▼
API Gateway
      │
      ▼
Admin Service
      │
      │ REST
      ▼
Payment Service
      │
      ▼
Payment Provider
```
Admin should **not** modify `payment_db`.

---

## 34. Admin + Kafka

Admin also consumes events for dashboard information:

```
Order
  │
  │ OrderCreated
  ▼
Kafka
  │
  ▼
Admin
```

Similarly:
- `PaymentFailed`
- `InventoryLow`
- `SellerCreated`
- `ReviewReported`
- `NotificationFailed`

Admin can maintain operational/dashboard data.

---

## 35. API Gateway Communication

The API Gateway communicates with all public-facing backend services:

```
Frontend
    │
    ▼
API Gateway
    │
    ├── Auth
    ├── User
    ├── Catalog
    ├── Search
    ├── Cart
    ├── Inventory
    ├── Order
    ├── Payment
    ├── Shipping
    ├── Pricing
    ├── Review
    ├── Notification
    ├── Recommendation
    ├── Seller
    └── Admin
```
**The Gateway should not communicate with databases.**

---

## 36. Gateway vs Service-to-Service Communication

This distinction is crucial.

### User Request:
$$\text{Frontend} \longrightarrow \text{API Gateway} \longrightarrow \text{Catalog}$$

### Backend Request:
$$\text{Order} \longrightarrow \text{Inventory}$$

The second request does **not** need to go through the API Gateway.

```
Correct:
Order ──────► Inventory

Not:
Order ──► API Gateway ──► Inventory
```
The Gateway is strictly for external/client traffic.

---

## 37. Kafka Architecture

Use one Kafka cluster initially.

```
                    Kafka Cluster
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 catalog.events      order.events      payment.events
       │                 │                 │
       ▼                 ▼                 ▼
     Search          Notification         Order
     Pricing         Seller              Inventory
     Review          Admin               Notification
```
You don't need a separate Kafka cluster for every service.

---

## 38. Recommended Kafka Topics

- `auth.events`
- `user.events`
- `catalog.events`
- `search.events`
- `cart.events`
- `inventory.events`
- `order.events`
- `payment.events`
- `shipping.events`
- `pricing.events`
- `review.events`
- `notification.events`
- `recommendation.events`
- `seller.events`
- `admin.events`

*(Not every service must produce every event).*

---

## 39. Event Structure

Use a common event envelope:

```json
{
  "eventId": "evt-123",
  "eventType": "OrderPaid",
  "version": 1,
  "source": "order-service",
  "aggregateType": "order",
  "aggregateId": "order-123",
  "timestamp": "2026-09-14T01:00:00Z",
  "correlationId": "req-456",
  "payload": {
    "orderId": "order-123",
    "userId": "user-123",
    "total": 150.00,
    "currency": "USD"
  }
}
```
This makes distributed tracing and event processing straightforward and consistent.

---

## 40. Event Rules

Every consumer should be:
**Idempotent**

If the same event arrives twice:
`OrderPaid`
`OrderPaid`

It should not:
- ❌ charge twice
- ❌ ship twice
- ❌ send duplicate emails

Use `eventId` to detect and discard duplicates.

---

## 41. Transactional Outbox

This is strongly recommended.

### Without Outbox (Dual-write hazard):
```
Order DB update
      ↓
Kafka publish
      ↓
Kafka fails ❌
```
Now your database says `ORDER_PAID`, but nobody received the event.

### With Outbox:
```
Order Service
      │
      ├── PostgreSQL transaction
      │      ├── update order
      │      └── create outbox event
      │
      ▼
   Outbox Worker
      │
      ▼
    Kafka
```
This should be used for all critical business events.

---

## 42. Checkout Saga

Your checkout crosses multiple services, so don't use a distributed database transaction. Use a **Saga**.

```
                Checkout
                   │
                   ▼
                 Order
                   │
                   ▼
              Reserve Stock
                   │
             success?
              /       \
            yes        no
             │          │
             ▼          ▼
          Payment     Order Failed
             │
        success?
         /     \
       yes      no
        │        │
        ▼        ▼
 Confirm      Release
 Inventory    Inventory
        │
        ▼
    Create Shipment
```
This is the correct model for your distributed microservices architecture.

---

## 43. Failure Communication

### Inventory Fails
```
Order
  │
  ▼
Inventory
  │
  X INSUFFICIENT_STOCK
  │
  ▼
Order FAILED
```

### Payment Fails
```
Order
  │
  ▼
Payment
  │
  X PaymentFailed
  │
  ▼
Kafka
  │
  ▼
Order
  │
  ▼
Inventory Release
```

### Shipping Fails
```
Shipping
   │
   │ ShipmentCreationFailed
   ▼
Kafka
   │
   ▼
Order / Notification / Admin
```

---

## 44. Communication Rules by Service

```
Auth
 ├── User           → REST/Kafka
 └── Notification   → Kafka

User
 ├── Auth           → REST/Kafka
 └── Notification   → Kafka

Catalog
 ├── Search         → Kafka
 ├── Pricing        → Kafka/REST
 ├── Review         → Kafka
 ├── Recommendation → Kafka
 └── Seller         → REST/Kafka

Search
 └── Catalog        → Kafka

Cart
 ├── Catalog        → REST
 ├── Pricing        → REST
 ├── Inventory      → REST
 └── Order          → REST

Inventory
 ├── Order          → REST/Kafka
 ├── Seller         → REST/Kafka
 ├── Admin          → REST
 └── Notification   → Kafka

Order
 ├── Cart           → REST
 ├── User           → REST
 ├── Pricing        → REST
 ├── Inventory      → REST
 ├── Payment        → REST/Kafka
 ├── Shipping       → REST/Kafka
 ├── Notification   → Kafka
 ├── Review         → Kafka
 └── Seller         → Kafka

Payment
 ├── External Payment Provider → HTTPS
 ├── Order                     → Kafka
 └── Notification              → Kafka

Shipping
 ├── Order          → REST/Kafka
 ├── Carrier        → HTTPS
 ├── Notification   → Kafka
 └── Seller         → Kafka

Pricing
 ├── Catalog        → REST/Kafka
 ├── Cart           → REST
 ├── Order          → REST
 └── Seller         → Kafka/REST

Review
 ├── Order          → Kafka/REST
 ├── Catalog        → Kafka
 ├── Search         → Kafka
 ├── Seller         → Kafka
 └── Notification   → Kafka

Notification
 └── Kafka          → consumes business events

Recommendation
 ├── Catalog        → Kafka
 ├── Search         → Kafka
 ├── Cart           → Kafka
 ├── Order          → Kafka
 └── Review         → Kafka

Seller
 ├── Catalog        → REST/Kafka
 ├── Inventory      → REST/Kafka
 ├── Order          → Kafka
 ├── Review         → Kafka
 └── Pricing        → REST/Kafka

Admin
 ├── Auth           → REST
 ├── User           → REST
 ├── Catalog        → REST
 ├── Seller         → REST
 ├── Order          → REST
 ├── Payment        → REST
 ├── Inventory      → REST
 ├── Review         → REST
 ├── Pricing        → REST
 ├── Shipping       → REST
 └── All events     → Kafka
```

---

## 45. Complete Customer Purchase Flow

This is the communication flow to implement first:

```
                         CUSTOMER
                            │
                            ▼
                        FRONTEND
                            │
                            ▼
                       API GATEWAY
                            │
                            ▼
                           CART
                            │
                     checkout request
                            │
                            ▼
                          ORDER
                            │
             ┌──────────────┼───────────────┐
             │              │               │
             ▼              ▼               ▼
          PRICING       INVENTORY          USER
             │              │               │
             │              │               │
             └──────────────┼───────────────┘
                            │
                     price + stock OK
                            │
                            ▼
                         PAYMENT
                            │
                            ▼
                    Payment Provider
                            │
                         success
                            │
                            ▼
                         PAYMENT
                            │
                     PaymentSucceeded
                            │
                            ▼
                          KAFKA
                            │
                            ▼
                          ORDER
                            │
                            ▼
                    Inventory Confirm
                            │
                            ▼
                         SHIPPING
                            │
                            ▼
                         CARRIER
                            │
                       delivered
                            │
                            ▼
                         SHIPPING
                            │
                            ▼
                          KAFKA
                            │
                            ▼
                           ORDER
                            │
                            ▼
                       COMPLETED
```

At the same time:
```
Order events
     │
     ├────► Notification
     ├────► Seller
     ├────► Recommendation
     ├────► Review
     └────► Admin
```

---

## 46. Product Page Communication

When the customer opens `/products/iphone-17`, the frontend may need:
- Catalog
- Pricing
- Inventory
- Review
- Recommendation

### Conceptually:
```
                 Product Page
                      │
                      ▼
                 API Gateway
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
     Catalog       Pricing       Inventory
        │             │              │
        └─────────────┼──────────────┘
                      │
               ┌──────┴──────┐
               ▼             ▼
            Review    Recommendation
```
*(For performance, you can later create a Backend-for-Frontend (BFF) or Gateway aggregation endpoint for complex pages, but avoid adding this complexity immediately unless needed).*

---

## 47. Search Page Communication

```
Frontend
   │
   ▼
API Gateway
   │
   ▼
Search Service
   │
   ▼
OpenSearch
```

Search does **not** need to call Catalog for every result:
```
Catalog
   │
   ▼
Kafka
   │
   ▼
Search
   │
   ▼
OpenSearch
```
This makes search fast and highly resilient.

---

## 48. Admin Dashboard Communication

For a dashboard:

```
Admin Frontend
       │
       ▼
API Gateway
       │
       ▼
 Admin Service
       │
       ├── Operational APIs
       │
       └── Aggregated data
```

- **For smaller scale / quick queries**: Admin can call Order, Payment, Seller, Inventory, Review via REST.
- **For a large production platform**:
```
Business Services
       │
       ▼
     Kafka
       │
       ▼
Analytics / Reporting
       │
       ▼
Admin Dashboard
```
This avoids making one dashboard request fan out synchronously to 10 services.

---

## 49. Recommended Communication Pattern

Your architecture should generally follow this rule:

### Synchronous (REST)
- `Frontend → Gateway`
- `Gateway → Service`
- `Cart → Catalog`
- `Cart → Pricing`
- `Order → Cart`
- `Order → Pricing`
- `Order → Inventory`
- `Order → Payment`
- `Order → User`
- `Admin → Business Service`

### Asynchronous (Kafka)
- `Catalog → Search`
- `Catalog → Recommendation`
- `Order → Notification`
- `Order → Seller`
- `Order → Review`
- `Payment → Order`
- `Shipping → Order`
- `Review → Search`
- `Review → Seller`
- `Inventory → Notification`
- `Inventory → Seller`
- `Business Services → Admin`
- `Business Services → Recommendation`

---

## 50. Final Communication Architecture

```
                           ┌───────────────┐
                           │    FRONTEND   │
                           │    Next.js    │
                           └───────┬───────┘
                                   │
                                   │ HTTPS
                                   ▼
                           ┌───────────────┐
                           │  API GATEWAY  │
                           │   Go + Gin    │
                           └───────┬───────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
           Auth                   User                 Catalog
             │                     │                     │
             │                     │                     ├──── Kafka ──► Search
             │                     │                     ├──── Kafka ──► Pricing
             │                     │                     ├──── Kafka ──► Review
             │                     │                     └──── Kafka ──► Recommendation
             │                     │
             │                     │
             └──────────────┐      │
                            ▼      ▼
                           Cart ◄──┘
                            │
                            ├──── REST ────► Catalog
                            ├──── REST ────► Pricing
                            └──── REST ────► Inventory
                            │
                            ▼
                          Order
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Pricing       Inventory        Payment
             │              │              │
             │              │              └──► Payment Provider
             │              │
             │              ▼
             │            Kafka
             │              │
             │       ┌──────┼───────┐
             │       ▼      ▼       ▼
             │    Seller  Admin  Notification
             │
             ▼
          Payment
             │
             ▼
           Kafka
             │
             ▼
           Order
             │
             ▼
         Shipping
             │
             ▼
          Carrier
             │
             ▼
           Kafka
             │
       ┌─────┼──────────────┐
       ▼     ▼              ▼
     Order Notification   Admin
```

---

## The 7 Rules Locked Into Your Project

1. **Frontend talks only to API Gateway.**
2. **API Gateway does not access databases.**
3. **Services never access another service's database.**
4. **REST for immediate operations; Kafka for asynchronous events.**
5. **Kafka events must be idempotent.**
6. **Important database + event operations use Transactional Outbox.**
7. **Checkout uses a Saga, not a distributed database transaction.**

> With these rules, your Next.js + Go Gateway + 15 business services + PostgreSQL/Redis/Kafka architecture has clean communication boundaries and can be developed service-by-service without turning into a tightly coupled system.
