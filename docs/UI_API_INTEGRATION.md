# E-Commerce UI/API Integration Specification

## 1. Core Rule

Every UI action must follow this strict unidirectional flow:

```text
UI
 │
 ▼
API Gateway (:8000)
 │
 ▼
Correct Backend Service
 │
 ▼
Own Database / Kafka Event
```

### Prohibited Patterns

* ❌ **UI ──X──> Database** (The frontend never chooses or connects directly to any database).
* ❌ **Customer UI ──X──> Seller Database** (Cross-domain access is strictly disallowed).
* ❌ **Admin UI ──X──> Direct Database Mutation** (The Admin portal must never execute raw SQL or mutate business databases directly; it must always call the respective service's API).
* ❌ **Browser ──X──> SSH / Shell Command** (Administrative deployments must trigger CI/CD jobs via the Admin Service, never raw shell scripts).

The frontend **only** knows the **API Gateway** (`http://localhost:8000` / `api.example.com`).

---

## 2. Two Frontends

```text
┌─────────────────────────────────────────────────────────────┐
│                     E-COMMERCE PLATFORM                     │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│      CUSTOMER FRONTEND       │       COMPANY FRONTEND       │
│      shop.example.com        │     company.example.com      │
│         Port :3000           │          Port :3001          │
│                              │                              │
│       BUYING EXPERIENCE      │    SELLER + ADMIN PORTAL     │
│                              │                              │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │ HTTPS
                              ▼
                      API GATEWAY :8000
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
         Customer APIs   Seller APIs    Admin APIs
```

---

## 3. UI/API Golden Rules

### Rule 1 — Frontend Never Chooses a Database
* ❌ `Customer → catalog_db`
* ❌ `Seller → inventory_db`
* ❌ `Admin → order_db`

Instead:
```text
Customer ──> API Gateway ──> Catalog Service ──> Catalog DB
```

### Rule 2 — Every Button Has One Authoritative Business Owner
Example: `[Add to Cart]`
* ✅ **Cart Service** owns the cart state.
* ❌ **Catalog Service** only defines product specifications, not customer cart contents.

### Rule 3 — UI Does Not Calculate Authoritative Money
The UI may display optimistic client-side calculations for responsiveness:
* `Subtotal`
* `Discount`
* `Tax`
* `Total`

However, the **Pricing Service** and **Order Service** hold exclusive authority over financial numbers, coupons, and final billing amounts.

```text
Customer UI ──> Order Service ──> Pricing Service ──> Authoritative Total
```

---

## 4. Customer Frontend Architecture

The Customer Frontend (`shop.example.com` / `:3000`) contains:

```text
CUSTOMER FRONTEND
├── PUBLIC
│   ├── Home (/)
│   ├── Search (/search)
│   ├── Categories (/categories)
│   ├── Product Details (/products/{id})
│   ├── Seller Store (/stores/{sellerId})
│   ├── Reviews (/products/{id}/reviews)
│   └── Recommendations
│
└── AUTHENTICATED CUSTOMER
    ├── Profile (/account/profile)
    ├── Addresses (/account/addresses)
    ├── Cart (/cart)
    ├── Checkout (/checkout)
    ├── Payment (/checkout/payment)
    ├── Orders (/orders)
    ├── Tracking (/orders/{id}/tracking)
    ├── Notifications (/notifications)
    └── Settings (/account/settings)
```

---

## 5. Customer — Home Page (`/`)

### Layout
```text
┌────────────────────────────────────────────────────────┐
│ [Logo]         [ Search Products... 🔍 ]   [🛒 Cart]   │
├────────────────────────────────────────────────────────┤
│                     HERO / PROMO BANNER                │
├────────────────────────────────────────────────────────┤
│ Categories (Icons / Carousels)                         │
├────────────────────────────────────────────────────────┤
│ Recommended For You                                    │
├────────────────────────────────────────────────────────┤
│ Trending Products                                      │
└────────────────────────────────────────────────────────┘
```

### API Endpoints
* `GET /api/v1/categories` → **Catalog Service**
* `GET /api/v1/recommendations/home` → **Recommendation Service**
* `GET /api/v1/products?featured=true` → **Catalog / Search Service**
* `GET /api/v1/promotions/active` → **Pricing Service**
* `GET /api/v1/cart/count` → **Cart Service**

---

## 6. Customer — Search Page (`/search?q=query`)

### Layout
```text
Search: [ iPhone 15 Pro              ] [Search]

Filters                  Results (1,240 items)   Sort: [Relevance ▼]
☐ Apple                 ┌──────────┐ ┌──────────┐ ┌──────────┐
☐ Electronics           │ Image    │ │ Image    │ │ Image    │
Price: [$500 - $1500]   │ iPhone 15│ │ iPhone 14│ │ iPhone 13│
Rating: [★ 4.0 & up ]   │ $999     │ │ $799     │ │ $599     │
                        └──────────┘ └──────────┘ └──────────┘
```

### API Endpoint
* `GET /api/v1/search?q=query&category=...&brand=...&minPrice=...&sort=...`
* **Owner**: **Search Service** (backed by **OpenSearch** cluster).
* **Rule**: Never query PostgreSQL directly for free-text search or faceted navigation.

---

## 7. Product Detail Page (`/products/{productId}`)

### Layout
```text
┌────────────────────────────────────────────────────────┐
│ [Gallery]               MacBook Pro 16" (M3 Pro)       │
│ ┌──────────┐            ★★★★★ 4.8 (142 reviews)        │
│ │  IMAGE   │            $2,499.00                      │
│ └──────────┘            Availability: In Stock (12 left)│
│ [thumb] [thumb]         Seller: Apex Electronics       │
│                                                        │
│                         Quantity: [- 1 +]              │
│                         [ Add to Cart ]   [ Buy Now ]  │
└────────────────────────────────────────────────────────┘
  Customer Reviews & Ratings
  Frequently Bought Together
```

### Composed APIs
* `GET /api/v1/products/{id}` → **Catalog Service** (Attributes, specifications, images)
* `GET /api/v1/pricing/products/{id}` → **Pricing Service** (Active base price, discounts)
* `GET /api/v1/inventory/{variantId}` → **Inventory Service** (Stock count, availability)
* `GET /api/v1/reviews/products/{id}` → **Review Service** (Average rating, rating breakdown)
* `GET /api/v1/recommendations/products/{id}` → **Recommendation Service** (Related items)
* `GET /api/v1/seller/listings?productId={id}` → **Seller Service** (Verified seller info)

---

## 8. Product Page Button Rules

### `[Add to Cart]`
```text
[Add to Cart]
      │
      ▼
POST /api/v1/cart/items
      │
      ▼
Cart Service
```
* **Payload**: `{"variantId": "var-123", "quantity": 1}`
* **Behavior**: Cart Service validates variant existence and current pricing. Does **not** place a permanent inventory reservation.

### `[Buy Now]`
```text
[Buy Now] ──> Initializes fast-track Checkout Flow ──> Order Service
```
* **Rule**: Never invoke Payment Service directly from the product page. Immediate purchases must go through Order creation and inventory reservation first.

---

## 9. Cart Page (`/cart`)

### Layout & Endpoints
```text
MY CART (2 items)
----------------------------------------------------------
MacBook Pro 16"               Qty: [- 1 +]       $2,499.00 [Remove]
Apple Magic Mouse              Qty: [- 1 +]          $79.00 [Remove]
----------------------------------------------------------
Subtotal: $2,578.00
[ Continue Shopping ]                     [ Proceed to Checkout ]
```

* `GET /api/v1/cart` → **Cart Service**
* `PATCH /api/v1/cart/items/{itemId}` → **Cart Service** (Update quantity)
* `DELETE /api/v1/cart/items/{itemId}` → **Cart Service** (Remove item)

---

## 10. Checkout Page (`/checkout`)

### Layout
```text
CHECKOUT
1. Shipping Address
   [ Select Saved Address ] or [ + Add New ]

2. Order Review
   MacBook Pro 16" × 1 — $2,499.00

3. Pricing Summary
   Subtotal:    $2,499.00
   Shipping:       $15.00
   Estimated Tax: $200.00
   Total:       $2,714.00

4. Payment Method
   (●) Credit / Debit Card
   ( ) Digital Wallet

                 [ Place Order ]
```

### Authoritative Coordinator
The frontend does **not** orchestrate the Saga. It calls:
```text
POST /api/v1/orders
Headers:
  Idempotency-Key: chk-9a8f21bc-341e
```
* **Owner**: **Order Service** acts as the Saga coordinator.
* **Orchestration**:
  1. Calls **Pricing Service** (compute final totals and lock coupons).
  2. Calls **Inventory Service** (synchronous `POST /reservations`).
  3. Calls **Payment Service** (create PaymentIntent).
  4. Calls **Shipping Service** (prepare shipment draft).

---

## 11. Payment Page & Webhooks

```text
Order #ORD-10023
Amount Due: $2,714.00

[ Stripe / Payment Provider Card Element ]

[ Authorize & Pay ]
```

### Security Rules
* ❌ The browser **never** sends `{"amount": 2714.00}` directly to the Payment Service.
* ✅ The Payment Service derives the authoritative amount directly from the **Order Service**.
* ✅ The payment provider's webhook notifies the **Payment Service**, which publishes `PaymentCaptured` to Kafka to advance the Order Saga.

---

## 12. Orders, Tracking & Reviews

### Order History (`/orders`)
* `GET /api/v1/orders` → **Order Service**

### Order Details (`/orders/{orderId}`)
* `GET /api/v1/orders/{orderId}` → **Order Service**
* `GET /api/v1/shipping/orders/{orderId}` → **Shipping Service**
* `POST /api/v1/orders/{orderId}/cancel` → **Order Service** (Triggers Saga cancellation compensation)

### Order Tracking (`/orders/{orderId}/tracking`)
* `GET /api/v1/shipping/orders/{orderId}/tracking` → **Shipping Service**

### Product Reviews (`/orders/{orderId}/review`)
* `POST /api/v1/reviews` → **Review Service**
* **Enforcement**: Review Service checks `OrderCompleted` event history in its own database. The client cannot forge `verifiedPurchase = true`.

---

## 13. Customer Account & Notifications

### Profile Management (`/account/profile`)
* `GET /api/v1/users/me` → **User Service**
* `PATCH /api/v1/users/me` → **User Service**

### Address Book (`/account/addresses`)
* `GET /api/v1/users/me/addresses` → **User Service**
* `POST /api/v1/users/me/addresses` → **User Service**
* `PATCH /api/v1/users/me/addresses/{id}` → **User Service**
* `DELETE /api/v1/users/me/addresses/{id}` → **User Service**
* `POST /api/v1/users/me/addresses/{id}/default` → **User Service**

### Notifications (`/notifications`)
* `GET /api/v1/notifications` → **Notification Service**
* `PATCH /api/v1/notifications/{id}/read` → **Notification Service**

---

## 14. Company Frontend — Seller Portal (`/seller/*`)

Accessed at `company.example.com/seller/*` or `localhost:3001/seller/*`.

### 1. Seller Dashboard (`/seller/dashboard`)
* `GET /api/v1/seller/dashboard` → **Seller Service**
* `GET /api/v1/seller/orders?limit=5` → **Seller Service** (filtered by authenticated seller ID)
* `GET /api/v1/seller/performance` → **Seller Service**

### 2. Seller Store Profile (`/seller/store`)
* `GET /api/v1/seller/store` → **Seller Service**
* `PATCH /api/v1/seller/store` → **Seller Service**

### 3. Seller Listings (`/seller/products`)
* `GET /api/v1/seller/listings` → **Seller Service**
* `POST /api/v1/seller/listings` → **Seller Service** (Validates product with Catalog, sets price in Pricing, allocates stock in Inventory)
* `PATCH /api/v1/seller/listings/{id}` → **Seller Service**

### 4. Seller Inventory Management (`/seller/inventory`)
* `GET /api/v1/inventory/seller` → **Inventory Service**
* `POST /api/v1/inventory/items/{id}/stock` → **Inventory Service** (Add new inventory batch)
* `POST /api/v1/inventory/items/{id}/adjust` → **Inventory Service** (Shrinkage / cycle count)

### 5. Seller Orders (`/seller/orders`)
* `GET /api/v1/seller/orders` → **Seller Service**
* **Security Guard**: Sellers can **only** query line items belonging to their merchant account. They cannot view marketplace-wide orders.

### 6. Seller Promotions (`/seller/promotions`)
* `GET /api/v1/pricing/seller/promotions` → **Pricing Service**
* `POST /api/v1/pricing/seller/promotions` → **Pricing Service**

---

## 15. Company Frontend — Admin Control Plane (`/admin/*`)

Accessed at `company.example.com/admin/*` or `localhost:3001/admin/*`.

### 1. Admin Dashboard (`/admin/dashboard`)
* `GET /api/v1/admin/dashboard` → **Admin Service** (Aggregates high-level system telemetry)

### 2. User & Seller Moderation (`/admin/users`, `/admin/sellers`)
* `GET /api/v1/admin/users` → **Admin Service**
* `POST /api/v1/admin/users/{id}/suspend` → **Admin Service** (calls Auth/User Service)
* `GET /api/v1/admin/sellers` → **Admin Service**
* `POST /api/v1/admin/sellers/{id}/approve` → **Admin Service** (calls Seller Service)
* `POST /api/v1/admin/sellers/{id}/reject` → **Admin Service**

### 3. Catalog Moderation (`/admin/products`)
* `GET /api/v1/admin/products` → **Admin Service**
* `POST /api/v1/admin/products/{id}/moderate` → **Admin Service** (orchestrates update to Catalog Service)

### 4. Financial & Order Oversight (`/admin/orders`, `/admin/payments`)
* `GET /api/v1/admin/orders` → **Admin Service**
* `POST /api/v1/admin/orders/{id}/cancel` → **Admin Service** (calls Order Service)
* `GET /api/v1/admin/payments` → **Admin Service**
* `POST /api/v1/admin/payments/{id}/refund` → **Admin Service** (calls Payment Service)

### 5. Audit Logging (`/admin/audit-logs`)
* `GET /api/v1/admin/audit-logs` → **Admin Service** (Immutable, append-only security log)

### 6. Production Deployment Control (`/admin/deployment`)
* `POST /api/v1/admin/deployments` → **Admin Service** triggers secure CI/CD webhook with verification tokens.
* **Security Rule**: The browser never opens an SSH tunnel or executes local bash deployment scripts directly.

---

## 16. Comprehensive Frontend API Matrix

### Customer Frontend (`:3000`)

| Page | Action / Component | API Route | Authoritative Service |
| :--- | :--- | :--- | :--- |
| Home (`/`) | Category Carousels | `GET /api/v1/categories` | Catalog Service |
| Home (`/`) | Personalized Feed | `GET /api/v1/recommendations/home` | Recommendation Service |
| Home (`/`) | Promo Banners | `GET /api/v1/promotions/active` | Pricing Service |
| Search (`/search`) | Faceted Search & Filters | `GET /api/v1/search` | Search Service (OpenSearch) |
| Product Detail | Product Specifications | `GET /api/v1/products/{id}` | Catalog Service |
| Product Detail | Current Pricing & Deals | `GET /api/v1/pricing/products/{id}` | Pricing Service |
| Product Detail | Stock Availability | `GET /api/v1/inventory/{variantId}` | Inventory Service |
| Product Detail | Customer Reviews | `GET /api/v1/reviews/products/{id}` | Review Service |
| Product Detail | `[Add to Cart]` | `POST /api/v1/cart/items` | Cart Service |
| Cart (`/cart`) | Fetch Active Cart | `GET /api/v1/cart` | Cart Service |
| Cart (`/cart`) | Update Item Quantity | `PATCH /api/v1/cart/items/{id}` | Cart Service |
| Cart (`/cart`) | Remove Item | `DELETE /api/v1/cart/items/{id}` | Cart Service |
| Checkout | `[Place Order]` | `POST /api/v1/orders` | Order Service (Saga Coordinator) |
| Payment | Complete Payment | `POST /api/v1/payments/{intentId}/confirm` | Payment Service |
| Orders | Order History | `GET /api/v1/orders` | Order Service |
| Orders | Shipment Tracking | `GET /api/v1/shipping/orders/{id}/tracking` | Shipping Service |
| Orders | Post-Delivery Review | `POST /api/v1/reviews` | Review Service |
| Profile | Update Profile | `PATCH /api/v1/users/me` | User Service |
| Addresses | Manage Addresses | `POST/PATCH /api/v1/users/me/addresses` | User Service |
| Notifications | Mark as Read | `PATCH /api/v1/notifications/{id}/read` | Notification Service |

---

### Company Frontend — Seller Portal (`:3001/seller/*`)

| Page | Action / Component | API Route | Authoritative Service |
| :--- | :--- | :--- | :--- |
| Dashboard | Metrics & Top Sales | `GET /api/v1/seller/dashboard` | Seller Service |
| Store | Update Store Branding | `PATCH /api/v1/seller/store` | Seller Service |
| Listings | View Active Listings | `GET /api/v1/seller/listings` | Seller Service |
| Listings | `[+ Add Product]` | `POST /api/v1/seller/listings` | Seller Service (calls Catalog + Pricing) |
| Listings | Update Listing Offer | `PATCH /api/v1/seller/listings/{id}` | Seller Service |
| Inventory | Stock Overview | `GET /api/v1/inventory/seller` | Inventory Service |
| Inventory | Add Restock Batch | `POST /api/v1/inventory/items/{id}/stock` | Inventory Service |
| Orders | Seller Order Queue | `GET /api/v1/seller/orders` | Seller Service |
| Promotions | Create Coupon / Deal | `POST /api/v1/pricing/seller/promotions` | Pricing Service |
| Reviews | Merchant Review Feed | `GET /api/v1/seller/reviews` | Review Service |
| Performance | Sales & Payout Analytics | `GET /api/v1/seller/performance` | Seller Service |

---

### Company Frontend — Admin Control Plane (`:3001/admin/*`)

| Page | Action / Component | API Route | Authoritative Service |
| :--- | :--- | :--- | :--- |
| Dashboard | System Telemetry | `GET /api/v1/admin/dashboard` | Admin Service |
| Users | User Directory | `GET /api/v1/admin/users` | Admin Service |
| Users | Suspend Account | `POST /api/v1/admin/users/{id}/suspend` | Admin Service → Auth / User Service |
| Sellers | Pending Applications | `GET /api/v1/admin/sellers?status=PENDING` | Admin Service |
| Sellers | Approve Merchant | `POST /api/v1/admin/sellers/{id}/approve` | Admin Service → Seller Service |
| Products | Catalog Governance | `GET /api/v1/admin/products` | Admin Service |
| Products | Moderate Listing | `POST /api/v1/admin/products/{id}/moderate` | Admin Service → Catalog Service |
| Orders | Order Oversight | `GET /api/v1/admin/orders` | Admin Service |
| Orders | Force Cancel Order | `POST /api/v1/admin/orders/{id}/cancel` | Admin Service → Order Service |
| Payments | Audit Transactions | `GET /api/v1/admin/payments` | Admin Service |
| Payments | Issue Refund | `POST /api/v1/admin/payments/{id}/refund` | Admin Service → Payment Service |
| Inventory | Warehouse Adjustment | `POST /api/v1/admin/inventory/adjust` | Admin Service → Inventory Service |
| Reviews | Content Moderation | `POST /api/v1/admin/reviews/{id}/moderate` | Admin Service → Review Service |
| Audit Logs | Query Immutable Log | `GET /api/v1/admin/audit-logs` | Admin Service |
| Deployment | Request Release | `POST /api/v1/admin/deployments` | Admin Service → CI/CD Pipeline |

---

## 17. The 4-Question UI Design Checklist

For every new page, modal, button, form, or UI action, engineers must answer these four questions **before writing any code**:

### 1. WHO is clicking it?
Identify the actor and context:
* **CUSTOMER** (Public shopper / authenticated buyer)
* **SELLER** (Merchant managing marketplace store)
* **ADMIN** (Platform governance / control-plane operator)

*Example*: `[Add Stock]` → **Seller**

### 2. WHAT business action are they performing?
Describe the real business operation, not the generic UI name:
* `[Add Stock]` → Add inventory stock to a seller's product listing
* `[Place Order]` → Create a customer order and initialize checkout Saga
* `[Approve Seller]` → Approve a merchant marketplace application
* `[Refund]` → Issue a payment refund to a customer
* `[Publish Product]` → Activate a product / merchant listing

### 3. WHICH microservice owns that business action?
Select the backend service according to domain and data ownership, **never** out of convenience:
* Add Stock → **Inventory Service**
* Place Order → **Order Service**
* Approve Seller → **Seller Service**
* Refund → **Payment Service**
* Update Product Definition → **Catalog Service**

### 4. WHICH API represents that action?
After identifying the service owner, identify the canonical API route:
* `WHO`: Seller
* `WHAT`: Add inventory
* `SERVICE`: Inventory Service
* `API`: `POST /api/v1/inventory/items/{id}/stock`

```text
Seller
  │
  ▼
Company Frontend
  │
  ▼
API Gateway
  │
  ▼
Inventory Service
  │
  ▼
Inventory Database
```

---

## 18. End-to-End Concrete Architecture Examples

### Example 1 — Add to Cart
* **WHO?** Customer
* **WHAT?** Add product/variant to shopping cart
* **SERVICE?** Cart Service
* **API?** `POST /api/v1/cart/items`

```text
Customer
   │
   ▼
[Add to Cart]
   │
   ▼
Customer Frontend (:3000)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Cart Service (:8005)
   │
   ▼
Cart DB (PostgreSQL + Redis)
```

---

### Example 2 — Place Order
* **WHO?** Customer
* **WHAT?** Create an order / initiate Checkout Saga
* **SERVICE?** Order Service
* **API?** `POST /api/v1/orders` (Headers: `Idempotency-Key: ...`)

```text
Customer
   │
   ▼
[Place Order]
   │
   ▼
Customer Frontend (:3000)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Order Service (:8007)
   │
   ├──> Pricing Service (:8010)       [Verify prices & coupons]
   ├──> Inventory Service (:8006)     [POST /reservations]
   ├──> Payment Service (:8008)       [Create PaymentIntent]
   └──> Shipping Service (:8009)      [Prepare shipment draft]
```
> **Rule**: The frontend never calls all four services itself. Order Service coordinates the Saga.

---

### Example 3 — Add Stock
* **WHO?** Seller
* **WHAT?** Increase product inventory stock
* **SERVICE?** Inventory Service
* **API?** `POST /api/v1/inventory/items/{id}/stock`

```text
Seller
   │
   ▼
[Add Stock]
   │
   ▼
Company Frontend (:3001)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Inventory Service (:8006)
   │
   ▼
Inventory DB (PostgreSQL)
   │
   ▼
StockAdded Event ──> Kafka
```

---

### Example 4 — Approve Seller Application
* **WHO?** Admin
* **WHAT?** Approve a pending seller application
* **SERVICE?** Seller Service (via Admin Service control plane)
* **API?** `POST /api/v1/admin/sellers/{id}/approve`

```text
Admin
   │
   ▼
[Approve Seller]
   │
   ▼
Company Frontend (:3001)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Admin Service (:8015) ──[Logs Audit Trail]
   │
   ▼
Seller Service (:8014)
   │
   ▼
Seller DB (PostgreSQL)
```

---

### Example 5 — Refund Payment
* **WHO?** Admin
* **WHAT?** Refund a customer's order payment
* **SERVICE?** Payment Service (via Admin Service control plane)
* **API?** `POST /api/v1/admin/payments/{id}/refund`

```text
Admin
   │
   ▼
[Refund]
   │
   ▼
Company Frontend (:3001)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Admin Service (:8015) ──[Verifies MFA & Audit Log]
   │
   ▼
Payment Service (:8008)
   │
   ▼
Payment Provider (Stripe / Bank Webhook)
```
> **Rule**: The Admin Service manages permissions and audit logs; the Payment Service owns the actual financial transaction.

---

### Example 6 — Production Software Deployment
* **WHO?** Authorized Admin / DevOps
* **WHAT?** Trigger an automated production software deployment
* **SERVICE?** Admin Service → CI/CD Pipeline
* **API?** `POST /api/v1/admin/deployments`

```text
Admin / DevOps
   │
   ▼
[Deploy Production]
   │
   ▼
Company Frontend (:3001)
   │
   ▼
API Gateway (:8000)
   │
   ▼
Admin Service (:8015)
   │
   ▼
CI/CD Pipeline Webhook
   │
   ▼
Docker Registry
   │
   ▼
Production Server (Rolling Update & Health Check)
```
> **Rule**: Deployments are never triggered via browser SSH or raw shell commands.

---

## 19. What Engineers Should Write Before Coding

For every new feature, engineers must document this brief specification template before touching code:

```text
Feature: Add Stock

Actor:
  Seller

Frontend:
  Company Frontend (:3001)

Page:
  /seller/inventory

UI Component:
  [Add Stock] Modal

Business Action:
  Increase inventory quantity for a specific SKU/variant

Owner Service:
  Inventory Service

API Endpoint:
  POST /api/v1/inventory/items/{id}/stock

Authorization:
  Role: SELLER + Permission: inventory.write

Database Owner:
  Inventory Service (inventory_db)

Events Published:
  StockAdded (inventory.events)

Audit Required:
  Yes
```

---

## 20. The Golden Architecture Sequence

Always follow this derivation order:

```text
WHO (Actor)
 │
 ▼
WHAT (Business Operation)
 │
 ▼
SERVICE (Domain Owner)
 │
 ▼
API (Gateway Endpoint)
 │
 ▼
DATABASE / KAFKA EVENT
```

Never reverse the sequence. Do not ask: *"I need a button, what API can I call?"*  
Always ask: ***"Who is using this? What business action are they performing? Which microservice owns that action? Then what API exposes it?"***

