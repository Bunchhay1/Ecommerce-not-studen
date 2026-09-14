# E-Commerce Marketplace — Complete Architecture Documentation

## 1. System Overview

The system is an **Amazon-like multi-vendor E-Commerce Marketplace** with:

* **Customer Frontend** — shopping experience
* **Company Frontend** — Seller + Admin management portal
* **API Gateway**
* **15 backend microservices**
* PostgreSQL
* Redis
* Kafka
* OpenSearch
* Object Storage
* Docker
* CI/CD
* Monitoring and observability

### High-Level Architecture

```text
                              INTERNET
                                  │
                                  ▼
                         Cloudflare / CDN / WAF
                                  │
                                  ▼
                              NGINX / LB
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          CUSTOMER FRONTEND             COMPANY FRONTEND
             Next.js :3000                 Next.js :3001
                    │                           │
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                           API GATEWAY :8000
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
        Customer APIs       Seller APIs          Admin APIs
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
              REST / HTTP                    Kafka
                    │                           │
                    ▼                           ▼
              Microservices              Event Consumers
                    │
        ┌───────────┼──────────────────────────────┐
        │           │                              │
        ▼           ▼                              ▼
   PostgreSQL     Redis                       OpenSearch
        │
        ▼
   Object Storage
```

---

# 2. Frontend Architecture

There are **2 separate frontends**.

```text
                    E-COMMERCE PLATFORM
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      CUSTOMER FRONTEND              COMPANY FRONTEND
         :3000                           :3001
             │                             │
             │                             │
        Customers                    Seller + Admin
             │                             │
             └──────────────┬──────────────┘
                            ▼
                       API Gateway
                           :8000
```

---

## 2.1 Customer Frontend

### Purpose

The Customer Frontend is the public shopping application.

Example:

```text
https://shop.example.com
```

### Technology

```text
Next.js 14
TypeScript
Tailwind CSS
Zustand
React
```

### Customer Features

```text
CUSTOMER FRONTEND
│
├── Home
├── Categories
├── Product Search
├── Product Details
├── Product Reviews
├── Recommendations
├── Cart
├── Checkout
├── Payment
├── Order History
├── Order Tracking
├── Wishlist
├── Profile
├── Addresses
├── Notifications
└── Account Settings
```

### Main Service Connections

```text
Customer Frontend
        │
        ▼
 API Gateway
        │
        ├── Auth Service
        ├── User Service
        ├── Catalog Service
        ├── Search Service
        ├── Cart Service
        ├── Pricing Service
        ├── Inventory Service
        ├── Order Service
        ├── Payment Service
        ├── Shipping Service
        ├── Review Service
        ├── Recommendation Service
        └── Notification Service
```

The browser **never connects directly to databases, Kafka, Redis, or internal services**.

---

# 2.2 Company Frontend

The Company Frontend is the management portal.

Example:

```text
https://company.example.com
```

It contains two major experiences:

```text
COMPANY FRONTEND
│
├── SELLER
│   ├── Dashboard
│   ├── Store
│   ├── Products
│   ├── Listings
│   ├── Inventory
│   ├── Orders
│   ├── Promotions
│   ├── Reviews
│   ├── Sales
│   └── Performance
│
└── ADMIN
    ├── Dashboard
    ├── Users
    ├── Sellers
    ├── Products
    ├── Orders
    ├── Payments
    ├── Inventory
    ├── Reviews
    ├── Promotions
    ├── Reports
    ├── System
    ├── Deployment
    └── Audit Logs
```

### Important

Seller and Admin are **not the same role**.

```text
CUSTOMER
   │
   └── Shopping

SELLER
   │
   └── Manage own marketplace business

ADMIN
   │
   └── Manage/control platform
```

Authorization is enforced by the backend, not only by frontend routes.

---

# 3. Complete Service List

| #  | Service                | Port | Technology       | Main Responsibility     |
| -- | ---------------------- | ---: | ---------------- | ----------------------- |
| 00 | Customer Frontend      | 3000 | Next.js          | Customer shopping       |
| 01 | Company Frontend       | 3001 | Next.js          | Seller + Admin portal   |
| 02 | API Gateway            | 8000 | Go               | API entry point         |
| 03 | Auth Service           | 8001 | Python/FastAPI   | Authentication          |
| 04 | User Service           | 8002 | Go               | Profiles + addresses    |
| 05 | Catalog Service        | 8003 | Java/Spring Boot | Products                |
| 06 | Search Service         | 8004 | Python/FastAPI   | Search                  |
| 07 | Cart Service           | 8005 | NestJS           | Shopping cart           |
| 08 | Inventory Service      | 8006 | Java/Spring Boot | Stock                   |
| 09 | Order Service          | 8007 | Java/Spring Boot | Orders + checkout       |
| 10 | Payment Service        | 8008 | .NET             | Payments                |
| 11 | Shipping Service       | 8009 | NestJS           | Shipping                |
| 12 | Pricing Service        | 8010 | Python/FastAPI   | Pricing + promotions    |
| 13 | Review Service         | 8011 | NestJS           | Reviews + ratings       |
| 14 | Notification Service   | 8012 | Elixir/Phoenix   | Notifications           |
| 15 | Recommendation Service | 8013 | Python/FastAPI   | Recommendations         |
| 16 | Seller Service         | 8014 | Java/Spring Boot | Marketplace sellers     |
| 17 | Admin Service          | 8015 | NestJS           | Platform administration |

---

# 4. API Gateway

```text
Customer Frontend ──┐
                    ├──> API Gateway :8000
Company Frontend ───┘
```

The Gateway handles:

* Authentication/token validation
* Routing
* Rate limiting
* CORS
* Request validation
* Correlation ID
* Logging
* API versioning
* TLS termination
* Basic authorization checks
* Load balancing

### Gateway Routing

```text
/api/v1/auth/*             → Auth :8001
/api/v1/users/*            → User :8002
/api/v1/products/*         → Catalog :8003
/api/v1/search/*           → Search :8004
/api/v1/cart/*             → Cart :8005
/api/v1/inventory/*        → Inventory :8006
/api/v1/orders/*            → Order :8007
/api/v1/payments/*         → Payment :8008
/api/v1/shipping/*         → Shipping :8009
/api/v1/pricing/*          → Pricing :8010
/api/v1/reviews/*          → Review :8011
/api/v1/notifications/*    → Notification :8012
/api/v1/recommendations/*  → Recommendation :8013
/api/v1/seller/*           → Seller :8014
/api/v1/admin/*            → Admin :8015
```

---

# 5. Communication Architecture

There are two primary communication methods.

```text
                    Communication
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
            REST                  Kafka
         Synchronous           Asynchronous
```

## Rule

```text
Need an immediate answer?
        │
       YES
        ↓
       REST

Can happen asynchronously?
        │
       YES
        ↓
      Kafka
```

### REST

Use for:

* Checkout commands
* Reserve inventory
* Create payment
* Get product
* Validate data
* Immediate business operations

### Kafka

Use for:

* Domain events
* Notifications
* Search indexing
* Analytics
* Recommendations
* Event propagation
* Loose coupling

---

# 6. Database Ownership

Every service owns its own data.

```text
Auth DB
User DB
Catalog DB
Cart DB
Inventory DB
Order DB
Payment DB
Shipping DB
Pricing DB
Review DB
Notification DB
Recommendation DB
Seller DB
Admin DB
```

A physical PostgreSQL cluster may host multiple databases/schemas, but **ownership remains separated**.

### Rule

```text
Service A
   │
   ├── Own DB
   │
   └── API/Event
          │
          ▼
       Service B
```

Never:

```text
Service A ──X──> Service B Database
```

---

# 7. Auth Service

### Responsibility

Auth owns identity and credentials.

```text
Auth
├── Register
├── Login
├── Password hashing
├── JWT
├── Refresh tokens
├── Authentication
├── Roles
└── Permissions
```

Does not own:

* Product
* Cart
* Orders
* Payment
* Inventory
* User addresses

### Technology

```text
Python
FastAPI
AsyncPG
PostgreSQL
Redis
Kafka
```

### Auth → User

After registration:

```text
Customer
   │
   ▼
Auth Service
   │
   ├── Create account
   │
   └── UserRegistered
             │
             ▼
           Kafka
             │
             ▼
        User Service
```

---

# 8. User Service

Owns:

```text
Profile
Addresses
Phone
Avatar
Preferences
Settings
```

Does not own passwords.

### Tables

```text
profiles
addresses
user_preferences
user_settings
```

---

# 9. Catalog Service

Catalog owns the product definition.

```text
Catalog
├── Products
├── Categories
├── Brands
├── Variants
├── SKUs
├── Attributes
├── Images
└── Specifications
```

### Catalog does NOT own

```text
Price       → Pricing
Stock       → Inventory
Seller      → Seller
Order       → Order
Payment     → Payment
```

### Events

```text
ProductCreated
ProductUpdated
ProductDeleted
ProductActivated
ProductArchived
CategoryCreated
CategoryUpdated
BrandCreated
BrandUpdated
```

---

# 10. Search Service

Search uses OpenSearch.

```text
Catalog
   │
   │ ProductCreated
   ▼
 Kafka
   │
   ▼
Search Service
   │
   ▼
OpenSearch
```

The Search Service does not become the source of truth.

```text
PostgreSQL = Source of Truth
OpenSearch  = Search Index
```

---

# 11. Pricing Service

Pricing owns:

```text
Base prices
Discounts
Coupons
Promotions
Campaigns
Eligibility
Coupon usage
```

### Important separation

```text
Catalog
"What is this product?"

Pricing
"How much does it cost?"
```

Use:

```text
NUMERIC(19,4)
Decimal
Currency
```

Never use floating-point values for financial calculations.

---

# 12. Cart Service

Cart owns:

```text
Cart
Cart Items
Quantities
```

Example:

```text
Cart
│
├── Product A × 2
├── Product B × 1
└── Product C × 3
```

Cart does not create orders.

### Cart validation

```text
Cart
 │
 ├──> Catalog → Product exists?
 │
 └──> Pricing → Current price?
```

The frontend must never be trusted for:

```text
price
discount
subtotal
total
```

---

# 13. Inventory Service

Inventory owns:

```text
Stock
Reservations
Stock movements
Warehouses
```

Main calculation:

```text
Available Stock
=
Total Stock - Reserved Stock
```

### Checkout reservation

```text
Order Service
      │
      │ REST
      ▼
Inventory Service
      │
      ├── Check stock
      │
      └── Reserve stock
```

Use atomic SQL operations/row locking to prevent overselling.

### Inventory Events

```text
InventoryCreated
StockAdded
StockAdjusted
StockReserved
StockReleased
StockConfirmed
StockLow
StockOut
InventoryUpdated
```

---

# 14. Order Service

Order Service is the **checkout hub**.

Owns:

```text
Orders
Order Items
Order totals
Order status
Order history
Order address snapshot
```

### Order statuses

```text
PENDING
PENDING_PAYMENT
PAID
PROCESSING
SHIPPED
DELIVERED
COMPLETED
CANCELLED
FAILED
REFUNDED
```

---

# 15. Order Address Snapshot

When an order is created:

```text
User Service
     │
     ▼
Customer Address
     │
     ▼
Order Service
     │
     ▼
Immutable Order Address Snapshot
```

If the customer later changes their address, the old order must remain unchanged.

---

# 16. Checkout Flow

The complete checkout process:

```text
Customer
   │
   ▼
Customer Frontend
   │
   ▼
API Gateway
   │
   ▼
Cart Service
   │
   ▼
Order Service
   │
   ├──> Pricing
   │
   ├──> Inventory ── Reserve
   │
   ├──> Payment ── Create Payment
   │
   └──> Shipping
```

After payment:

```text
Payment
   │
   ▼
PaymentCaptured
   │
   ▼
Kafka
   │
   ▼
Order Service
   │
   ▼
PAID
```

This is a **Saga workflow**.

---

# 17. Order → Inventory

Immediate reservation requires REST.

```text
Order
  │
  │ POST /reservations
  ▼
Inventory
  │
  ├── SUCCESS
  │
  └── OUT_OF_STOCK
```

After reservation:

```text
Inventory
   │
   ▼
StockReserved
   │
   ▼
Kafka
```

---

# 18. Order → Payment

```text
Order Service
      │
      │ REST
      ▼
Payment Service
      │
      ▼
Payment Provider
```

Order provides the authoritative amount.

Payment never trusts an amount directly supplied by the browser.

---

# 19. Payment Service

Owns:

```text
Payment Intent
Payment Status
Provider Integration
Webhooks
Refunds
Reconciliation
```

Statuses:

```text
CREATED
PENDING
REQUIRES_ACTION
AUTHORIZED
CAPTURED
FAILED
CANCELLED
REFUND_PENDING
REFUNDED
PARTIALLY_REFUNDED
```

### Payment Webhook

```text
Payment Provider
       │
       ▼
Payment Service
       │
       ├── Verify signature
       ├── Check event ID
       ├── Idempotency
       ├── Update payment
       │
       └── Publish PaymentCaptured
                    │
                    ▼
                  Kafka
                    │
                    ▼
              Order Service
```

---

# 20. Shipping Service

Owns:

```text
Shipment
Tracking
Carrier
Shipping rates
Labels
Delivery status
```

Statuses:

```text
PENDING
READY
LABEL_CREATED
PICKED_UP
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
FAILED
RETURNED
CANCELLED
```

### Shipping Flow

```text
Order
  │
  │ REST
  ▼
Shipping
  │
  ▼
Carrier
  │
  ▼
Shipping Events
  │
  ▼
Kafka
  │
  ▼
Order
```

---

# 21. Review Service

Owns:

```text
Reviews
Ratings
Rating summaries
Helpful votes
Reports
Moderation
Review media
```

A customer cannot simply send:

```text
verifiedPurchase = true
```

The backend determines purchase eligibility from Order events.

```text
Order
  │
  ▼
OrderCompleted
  │
  ▼
Kafka
  │
  ▼
Review Service
  │
  ▼
Purchase Eligibility
```

---

# 22. Review → Search

When rating changes:

```text
Review Service
      │
      ▼
RatingUpdated
      │
      ▼
Kafka
      │
      ▼
Search Service
      │
      ▼
OpenSearch
```

---

# 23. Notification Service

Notification is event-driven.

Consumes events such as:

```text
OrderCreated
OrderPaid
OrderShipped
OrderDelivered
PaymentFailed
ReviewPublished
StockLow
PromotionCreated
UserRegistered
```

Then sends:

```text
Email
SMS
Push
In-App Notification
```

Use:

```text
Oban
Retries
Backoff
Idempotency
Provider webhooks
```

---

# 24. Recommendation Service

Recommendation consumes behavioral events.

```text
ProductViewed
SearchPerformed
AddToCart
RemoveFromCart
OrderCompleted
ReviewCreated
```

Produces:

```text
Similar Products
Frequently Bought Together
Trending Products
Personalized Products
Recently Viewed
```

Cold start:

```text
No User History
      │
      ▼
Popular / Trending Products
```

---

# 25. Seller Service

Seller Service owns the marketplace seller.

```text
Seller
├── Onboarding
├── Verification
├── Store
├── Business information
├── Listings
├── Offers
├── Commission
└── Performance
```

### Important boundary

```text
Catalog
   ↓
"What product is it?"

Seller
   ↓
"Who sells it?"

Pricing
   ↓
"How much?"

Inventory
   ↓
"How many?"

Order
   ↓
"Who purchased it?"
```

### Seller listing

```text
Seller
  │
  ▼
Seller Service
  │
  ├── Seller listing
  │
  └── Validate product
           │
           ▼
        Catalog
```

---

# 26. Seller Frontend

The Seller section is inside Company Frontend.

```text
Company Frontend
      │
      ▼
    SELLER
      │
      ├── Dashboard
      ├── Store
      ├── Products
      ├── Listings
      ├── Inventory
      ├── Orders
      ├── Promotions
      ├── Reviews
      └── Analytics
```

Seller should only access resources they are authorized to manage.

---

# 27. Admin Service

Admin is the **control plane**.

Owns:

```text
Admin users
Roles
Permissions
Admin sessions
Audit logs
Admin actions
System configuration
```

### Admin roles

```text
SUPER_ADMIN
CATALOG_ADMIN
ORDER_ADMIN
FINANCE_ADMIN
MODERATOR
```

### Permissions

Examples:

```text
USER_VIEW
USER_UPDATE

SELLER_VIEW
SELLER_SUSPEND

PRODUCT_VIEW
PRODUCT_UPDATE

ORDER_VIEW
ORDER_CANCEL

PAYMENT_VIEW
PAYMENT_REFUND

DEPLOYMENT_VIEW
DEPLOYMENT_CREATE
DEPLOYMENT_PRODUCTION
DEPLOYMENT_ROLLBACK
```

---

# 28. Admin Frontend

```text
Company Frontend
      │
      ▼
     ADMIN
      │
      ├── Dashboard
      ├── Users
      ├── Sellers
      ├── Products
      ├── Orders
      ├── Payments
      ├── Inventory
      ├── Reviews
      ├── Promotions
      ├── Reports
      ├── System
      ├── Deployment
      └── Audit Logs
```

Admin does not directly access business databases.

```text
Admin Frontend
      │
      ▼
API Gateway
      │
      ▼
Admin Service
      │
      ├── REST → Business Services
      │
      └── Kafka → Events
```

---

# 29. Admin Deployment

Admin may have a **Production Deployment** feature.

But the Admin Service must **not execute shell commands directly**.

Correct:

```text
Admin Frontend
      │
      ▼
Admin Service
      │
      ▼
Deployment Request
      │
      ▼
CI/CD
      │
      ▼
Docker Registry
      │
      ▼
Production Server
      │
      ▼
Deploy
      │
      ▼
Health Check
      │
   ┌──┴──┐
   ▼     ▼
 PASS   FAIL
   │     │
 LIVE  ROLLBACK
```

High-risk deployments should require:

```text
MFA
Confirmation
Permission
Audit Log
```

---

# 30. Role Architecture

Authentication:

```text
"Who are you?"
        │
        ▼
     Auth
```

Authorization:

```text
"What can you do?"
        │
        ▼
 Roles + Permissions
```

Possible users:

```text
User
├── CUSTOMER
├── SELLER
└── ADMIN
```

A user can potentially have multiple roles.

Example:

```text
User
 ├── CUSTOMER
 └── SELLER
```

But permissions determine which APIs are allowed.

---

# 31. Frontend Route Protection

### Customer

```text
/products       → Public
/search         → Public
/cart            → Customer
/checkout        → Customer
/orders          → Customer
/profile         → Customer
```

### Company

```text
/seller/*       → SELLER
/admin/*        → ADMIN
```

Next.js middleware can protect routes, but backend authorization remains mandatory.

---

# 32. Kafka Architecture

Use **one shared Kafka cluster**.

```text
                         Kafka Cluster
                              │
       ┌──────────┬───────────┼───────────┬──────────┐
       │          │           │           │          │
       ▼          ▼           ▼           ▼          ▼
     Auth       User       Catalog     Inventory    Order
     Events     Events      Events       Events     Events
```

### Topics

```text
auth.events
user.events
catalog.events
search.events
cart.events
inventory.events
order.events
payment.events
shipping.events
pricing.events
review.events
notification.events
recommendation.events
seller.events
admin.events
```

---

# 33. Event Structure

Standard event envelope:

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

Consumers should support:

```text
eventId
idempotency
versioning
correlationId
```

---

# 34. Transactional Outbox

Business database update and event creation must be atomic.

```text
BEGIN
   │
   ├── Update business data
   │
   ├── Insert outbox event
   │
COMMIT
   │
   ▼
Outbox Worker
   │
   ▼
Kafka
```

This prevents:

```text
Database updated
BUT
Kafka event lost
```

---

# 35. Idempotency

Every important distributed operation should support idempotency.

Examples:

```text
Payment webhook
Order creation
Inventory reservation
Refund
Shipping creation
Kafka consumers
```

Example:

```text
eventId = evt-123

First time:
PROCESS

Second time:
IGNORE
```

---

# 36. Checkout Saga

The complete Saga:

```text
Customer
   │
   ▼
Create Order
   │
   ▼
Reserve Inventory
   │
   ▼
Create Payment
   │
   ▼
Payment Success
   │
   ▼
Confirm Inventory
   │
   ▼
Create Shipment
   │
   ▼
Order Processing
```

### Failure handling

```text
Inventory unavailable
      ↓
Order FAILED

Payment failed
      ↓
Release Inventory
      ↓
Order FAILED

Payment timeout
      ↓
Order PENDING_PAYMENT
      ↓
Reconciliation

Customer cancellation
      ↓
Release Inventory

Paid cancellation
      ↓
Refund Payment
```

---

# 37. Service-to-Service Communication

```text
Customer Frontend
        │
        ▼
   API Gateway
        │
        ▼
   Business APIs
```

Internal services should generally communicate directly:

```text
Order ──REST──> Inventory
Order ──REST──> Payment

Payment ──Kafka──> Order
Shipping ──Kafka──> Order

Catalog ──Kafka──> Search
Review ──Kafka──> Search

Order ──Kafka──> Notification
Order ──Kafka──> Recommendation
```

Do **not** force every internal request through the API Gateway.

---

# 38. Product Page Flow

```text
Customer
   │
   ▼
Customer Frontend
   │
   ▼
API Gateway
   │
   ├── Catalog
   │     └── Product information
   │
   ├── Pricing
   │     └── Price
   │
   ├── Inventory
   │     └── Availability
   │
   ├── Review
   │     └── Ratings
   │
   └── Recommendation
         └── Similar products
```

For performance, a Gateway/BFF composition endpoint can aggregate read-only data rather than making the browser perform many calls.

---

# 39. Search Flow

```text
Customer
   │
   ▼
Customer Frontend
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

Index updates:

```text
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

---

# 40. Customer Purchase Flow

```text
Customer Frontend
        │
        ▼
      Cart
        │
        ▼
      Order
        │
        ├── Pricing
        │
        ├── Inventory
        │
        └── Payment
               │
               ▼
          Payment Success
               │
               ▼
             Order
               │
               ▼
           Shipping
               │
               ▼
            Customer
```

---

# 41. Company Flow

```text
                    COMPANY FRONTEND
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
              SELLER                ADMIN
                 │                   │
                 ▼                   ▼
          Seller Service        Admin Service
                 │                   │
        ┌────────┼────────┐    ┌─────┼──────────┐
        ▼        ▼        ▼    ▼     ▼          ▼
     Catalog Inventory Pricing Order Payment  System
```

---

# 42. Redis

Redis is used for:

```text
Caching
Sessions
Rate limiting
Temporary state
Short-lived data
```

Examples:

```text
product:{id}
price:{productId}
cart:{userId}
rec:{userId}
rate-limit:{ip}
```

Redis is **not** the permanent source of truth.

---

# 43. Object Storage

Use:

```text
S3
Cloudflare R2
MinIO
```

For:

```text
Product images
Seller images
Review images
Documents
Invoices
Shipping labels
```

Large files should not be stored directly in PostgreSQL.

---

# 44. Production Infrastructure

For the initial production deployment:

```text
Ubuntu Server 24.04
16 CPU Cores
Docker
Docker Compose
Nginx
PostgreSQL
Redis
Kafka
OpenSearch
Object Storage
Prometheus
Grafana
OpenTelemetry
```

---

# 45. Production Network

```text
                         INTERNET
                            │
                            ▼
                     Cloudflare/WAF
                            │
                            ▼
                          NGINX
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       shop.example.com             company.example.com
             │                             │
             ▼                             ▼
      Customer Frontend             Company Frontend
             │                             │
             └──────────────┬──────────────┘
                            ▼
                      api.example.com
                            │
                            ▼
                       API Gateway
```

Internal services should not be publicly exposed.

---

# 46. Docker Deployment

Each service should have its own image.

Example:

```text
customer-frontend
company-frontend
api-gateway
auth-service
user-service
catalog-service
search-service
cart-service
inventory-service
order-service
payment-service
shipping-service
pricing-service
review-service
notification-service
recommendation-service
seller-service
admin-service
```

Use immutable tags:

```text
catalog:2026.09.14-a82f91c
order:2026.09.14-a82f91c
customer-frontend:2026.09.14-a82f91c
company-frontend:2026.09.14-a82f91c
```

Avoid:

```text
latest
```

for production deployments.

---

# 47. Auto Deployment

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub/GitLab
    │
    ▼
CI Pipeline
    │
    ├── Test
    ├── Lint
    ├── Build
    ├── Security Scan
    └── Docker Build
             │
             ▼
       Docker Registry
             │
             ▼
      Production Server
             │
             ▼
         deploy.sh
             │
        ┌────┴────┐
        ▼         ▼
     Backup    Migration
        │         │
        └────┬────┘
             ▼
          Deploy
             │
             ▼
        Health Check
          │     │
        PASS   FAIL
          │     │
          ▼     ▼
         LIVE  ROLLBACK
```

---

# 48. Independent Deployment

Do not redeploy every service when only one changes.

Example:

```text
Catalog changed
     │
     ▼
Deploy Catalog only
```

Frontend:

```text
Customer Frontend changed
     │
     ▼
Deploy Customer Frontend only
```

Company:

```text
Company Frontend changed
     │
     ▼
Deploy Company Frontend only
```

---

# 49. Monitoring

Use:

```text
Prometheus
Grafana
OpenTelemetry
Centralized Logs
```

Monitor:

```text
CPU
Memory
Disk
Network
Request latency
Error rate
Kafka lag
Database connections
Redis usage
OpenSearch health
Container health
Payment failures
Checkout failures
```

Frontend monitoring should include:

```text
Page load
Core Web Vitals
JavaScript errors
API latency
Failed requests
```

---

# 50. Final Architecture

```text
                                      INTERNET
                                         │
                                         ▼
                                CLOUDFLARE / WAF
                                         │
                                         ▼
                                      NGINX
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
                CUSTOMER FRONTEND                COMPANY FRONTEND
                   Next.js :3000                    Next.js :3001
                         │                               │
                         │                       ┌───────┴───────┐
                         │                       │               │
                         │                    SELLER           ADMIN
                         │                       │               │
                         └───────────────┬───────┴───────────────┘
                                         ▼
                                  API GATEWAY :8000
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       │                                 │                                 │
       ▼                                 ▼                                 ▼
    AUTH / USER                    COMMERCE SERVICES                  PLATFORM
       │                                 │                                 │
       │                    ┌────────────┼────────────┐                    │
       │                    │            │            │                    │
       ▼                    ▼            ▼            ▼                    ▼
     Auth                 Catalog       Cart        Order                Admin
     User                 Search      Inventory    Payment
                          Pricing      Shipping     Review
                                       Notification
                                    Recommendation
                                         Seller
                                           │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
               PostgreSQL             Redis                 Kafka
                    │                                         │
                    │                                         ▼
                    │                               Event Consumers
                    │
                    ├── Order DB
                    ├── Payment DB
                    ├── Catalog DB
                    ├── User DB
                    ├── Seller DB
                    └── Other service DBs
                                                              
                    Search
                       │
                       ▼
                  OpenSearch

                    Media
                       │
                       ▼
                 Object Storage
```

## Final Business Boundaries

```text
AUTH
Identity / Login / Roles

USER
Profile / Address

CATALOG
Product definition

SEARCH
Search index

CART
Shopping cart

PRICING
Price / Discount / Promotion

INVENTORY
Stock / Reservation

ORDER
Purchase / Checkout

PAYMENT
Money / Payment provider

SHIPPING
Shipment / Tracking

REVIEW
Rating / Reviews

NOTIFICATION
Email / SMS / Push

RECOMMENDATION
Personalization

SELLER
Marketplace business / Listings

ADMIN
Platform control / Governance

CUSTOMER FRONTEND
Shopping experience

COMPANY FRONTEND
Seller + Admin management
```

**The key architecture is:** **2 frontends → 1 API Gateway → business microservices → owned databases + Kafka/OpenSearch/Redis**, with **Customer, Seller, and Admin separated by role and permissions**.
