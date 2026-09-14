# Inventory Service — Core Service #06

## 1. Overview

The **Inventory Service** manages product stock and real-time availability across the marketplace. It is the platform's **single source of truth for stock quantities and reservations**.

### Responsibilities:
- Track total, reserved, and available stock (`available_quantity = total_quantity - reserved_quantity`).
- Prevent overselling using atomic conditional database operations and row-level pessimistic locking (`SELECT ... FOR UPDATE`).
- Manage the stock reservation lifecycle (`PENDING` -> `CONFIRMED` / `RELEASED` / `EXPIRED`).
- Maintain an immutable audit ledger of all inventory movements (`RECEIVE`, `RESERVE`, `RELEASE`, `SALE`, `ADJUSTMENT`, `RETURN`, `DAMAGE`, `TRANSFER`).
- Support multi-warehouse/location inventory management.
- Cache variant availability in **Redis** with write-through invalidation.
- Publish real-time events to **Kafka** on topic `inventory.events` (`InventoryCreated`, `StockAdded`, `StockAdjusted`, `StockReserved`, `StockReleased`, `StockConfirmed`, `StockLow`, `StockOut`).

---

## 2. Technology Stack

- **Language & Runtime:** Java 21+
- **Framework:** Spring Boot 3.3.4
- **Database & Migration:** PostgreSQL (`inventory_db`) & Flyway
- **ORM:** Spring Data JPA / Hibernate
- **Caching:** Redis (`spring-boot-starter-data-redis`)
- **Event Streaming:** Apache Kafka (`spring-kafka`)
- **Validation:** Jakarta Bean Validation
- **Security:** Spring Security + JWT Authentication Filter
- **Testing:** JUnit 5 + Mockito + H2 In-Memory
- **Documentation:** SpringDoc OpenAPI / Swagger UI

---

## 3. Architecture & Data Model

```
                    ┌─────────────────────────┐
                    │       API Gateway       │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
        Cart Service        Order Service       Admin / Seller
      (Check Avail.)       (Reserve/Confirm)    (Add/Adjust Stock)
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │   Inventory Service   │
                     │  (Java / Spring Boot) │
                     └───┬───────┬───────┬───┘
                         │       │       │
                         ▼       ▼       ▼
                   ┌──────────┐┌───────┐┌───────────┐
                   │PostgreSQL││ Redis ││   Kafka   │
                   │(Source of││(Avail.││(inventory.│
                   │  Truth)  ││ Cache)││  events)  │
                   └──────────┘└───────┘└───────────┘
```

### Concurrency & Overselling Prevention
To prevent two customers simultaneously purchasing the last item:
1. Reservations sort variant IDs to prevent database deadlocks.
2. Uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`).
3. Verifies `available_quantity >= requested_quantity` before updating.
4. Decrements available stock atomically within the database transaction.

---

## 4. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/inventory/{variantId}` | Get stock for a specific variant | No (Public) |
| `GET` | `/api/v1/inventory/sku/{sku}` | Get stock by SKU | No (Public) |
| `GET` | `/api/v1/inventory/product/{productId}` | Get stock for all variants of a product | No (Public) |
| `POST` | `/api/v1/inventory/check` | Batch check real-time stock availability | No (Public) |
| `POST` | `/api/v1/inventory/items` | Register new inventory item tracking | Yes (Admin/Seller) |
| `POST` | `/api/v1/inventory/{variantId}/stock` | Restock/Add stock to a variant | Yes (Admin/Warehouse) |
| `PATCH` | `/api/v1/inventory/{variantId}` | Adjust stock/threshold/status | Yes (Admin/Warehouse) |
| `POST` | `/api/v1/inventory/reservations` | Reserve stock for an order | Yes (Authenticated) |
| `GET` | `/api/v1/inventory/reservations/{id}` | Get reservation details | Yes (Authenticated) |
| `POST` | `/api/v1/inventory/reservations/{id}/confirm` | Confirm stock deduction on payment success | Yes (Authenticated) |
| `POST` | `/api/v1/inventory/reservations/{id}/release` | Release reserved stock on order cancel | Yes (Authenticated) |
| `GET` | `/api/v1/warehouses` | List warehouses | No (Public) |
| `POST` | `/api/v1/warehouses` | Create warehouse | Yes (Admin) |
| `GET` | `/api/v1/health` | Health check endpoint | No |

---

## 5. Running the Service

### Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL
- Redis
- Kafka

### Local Setup
```bash
# 1. Start dependencies with Docker Compose
docker-compose up -d postgres-inventory redis-inventory kafka-inventory

# 2. Run with Maven
mvn spring-boot:run
```

### Running Tests
```bash
mvn test
```

### OpenAPI Documentation
Once running, browse to: `http://localhost:8086/swagger-ui.html`
