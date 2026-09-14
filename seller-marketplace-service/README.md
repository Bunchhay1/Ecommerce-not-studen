# Core #14 — Seller / Marketplace Service

A robust, enterprise-grade marketplace and merchant management microservice built with **Java 21**, **Spring Boot 3.3.4**, **PostgreSQL**, **Redis**, **Kafka**, and **Flyway**.

## 1. Architectural Purpose & Boundary Hierarchy

The **Seller / Marketplace Service** manages the relationship between merchants (sellers) and the marketplace platform.

```
Catalog Service               Seller Service                   Pricing Service             Inventory Service             Order Service
(What is the product?)  -->   (Who sells it & in what offer?)  --> (How much is it?)   --> (Is stock available?)   -->   (Customer order)
- product_id                  - seller_id                      - base_price                - available_stock             - order_id
- variant_id                  - seller_sku                     - discount_price            - reserved_stock              - order_items
- name, brand, category       - listing_id & offer_id          - coupon / campaign         - warehouse location          - payment status
- specifications & images     - condition & fulfillment_type   - final calculated price    - stock reservations          - fulfillment status
```

### Strict Service Isolation Rules
- **No Direct Database Querying**: Never touches `catalog_db`, `order_db`, `payment_db`, or `inventory_db`.
- **Catalog Owns Master Product Identity**: Sellers reference `product_id` and `variant_id` replicated via `catalog.product.events`.
- **Inventory Owns Stock Quantities**: Stock state changes (`StockOut`, `StockAvailable`) arrive via Kafka `inventory.events`.
- **Pricing Owns Final Dynamic Prices**: Authoritative cart/checkout prices are computed by Promotion/Pricing Service; Seller service stores seller reference prices.
- **Auth Service Owns User Credentials**: `user_id` is extracted from verified JWT tokens; seller service never stores passwords.
- **Transactional Outbox Pattern**: State changes (`SellerCreated`, `ListingActivated`, etc.) are written to `outbox_events` in the same DB transaction to guarantee at-least-once Kafka publication.

---

## 2. Technology Stack & Port Allocations

| Component | Technology | Default Port / Connection |
| :--- | :--- | :--- |
| **Framework** | Spring Boot 3.3.4 / Java 21 | `8014` |
| **Database** | PostgreSQL 16 | `5445` (`seller_marketplace_db`) |
| **Cache** | Redis 7 | `6392` |
| **Message Broker** | Apache Kafka | `localhost:9092` |
| **Migrations** | Flyway | `db/migration/V1__init_seller_marketplace.sql` |
| **Security** | Spring Security + JWT | Stateless Bearer Auth |
| **Documentation** | SpringDoc OpenAPI | `/swagger-ui.html`, `/v3/api-docs` |

---

## 3. Core API Endpoints

### Seller Profile & Onboarding
- `POST /api/v1/sellers`: Register as a new marketplace seller (status: `PENDING`).
- `GET /api/v1/sellers/me`: Get current seller profile.
- `PATCH /api/v1/sellers/me`: Update seller profile details.
- `POST /api/v1/sellers/me/addresses`: Add warehouse or business address.
- `GET /api/v1/sellers/me/addresses`: List seller addresses.
- `GET /api/v1/sellers/me/performance`: View seller metrics, rating, and order stats.

### Seller Storefronts
- `POST /api/v1/sellers/me/store`: Create or update seller storefront (`storeName`, `slug`, `logoUrl`, `bannerUrl`).
- `GET /api/v1/sellers/me/store`: Get current seller store configuration.
- `GET /api/v1/stores/{slug}`: Public store details page.

### Product Listings & Offers
- `POST /api/v1/sellers/me/listings`: Create a new product listing / offer (enforces variant uniqueness).
- `GET /api/v1/sellers/me/listings`: List seller listings (paginated).
- `GET /api/v1/sellers/me/listings/{id}`: Get single listing details.
- `PATCH /api/v1/sellers/me/listings/{id}`: Update listing price reference, condition, or fulfillment type.
- `POST /api/v1/sellers/me/listings/{id}/activate`: Activate listing.
- `POST /api/v1/sellers/me/listings/{id}/pause`: Pause listing.
- `POST /api/v1/sellers/me/listings/{id}/archive`: Archive listing.

### Marketplace Public Comparison
- `GET /api/v1/products/{productId}/sellers`: Public PDP seller comparison ranking active sellers by lowest price and highest rating.

### Marketplace Administration
- `GET /api/v1/admin/sellers`: List all sellers (with status filter and pagination).
- `POST /api/v1/admin/sellers/{id}/verify`: Approve and activate seller account.
- `POST /api/v1/admin/sellers/{id}/suspend`: Suspend seller account and automatically pause their active listings.
- `POST /api/v1/admin/listings/{id}/approve`: Approve listing.
- `POST /api/v1/admin/listings/{id}/reject`: Reject listing.
- `POST /api/v1/admin/commissions`: Configure marketplace commission rule (category-specific or seller-specific).
- `GET /api/v1/admin/commissions`: List active commission rules.
- `GET /api/v1/admin/commissions/calculate`: Test commission fee calculation.

---

## 4. Building & Running

### Local Development

```bash
cd seller-marketplace-service

# Run automated tests
mvn clean test

# Run application locally
mvn spring-boot:run
```

### Docker Compose

```bash
docker-compose up --build -d
```
