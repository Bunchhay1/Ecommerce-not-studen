# Order Service — Core Service #07

## 1. Overview

The **Order Service** manages the complete lifecycle of customer orders in the E-Commerce platform following checkout.

### Responsibilities:
- Orchestrate checkout from Cart Service or direct items.
- Capture immutable product price & address snapshots at purchase time (`order_items`, `order_addresses`).
- Server-side calculation of subtotals, discounts, shipping fees, taxes, and grand totals.
- Coordinate distributed Sagas (Inventory Reservation, Payment, Cart Clearance).
- Manage order status state machine transitions (`PENDING`, `PENDING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `FAILED`, `REFUNDED`).
- Implement the **Transactional Outbox Pattern** to ensure zero event loss between PostgreSQL and Apache Kafka (`order.events`).
- Maintain an immutable audit trail in `order_status_history`.
- Cache active customer orders in Redis with user-level key structures.

---

## 2. Technology Stack

- **Language & Runtime:** Java 21+
- **Framework:** Spring Boot 3.3.4
- **Database & Migration:** PostgreSQL (`order_db`) & Flyway
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
                         API Gateway
                              │ (JWT Auth)
                              ▼
                        Order Service
                      (Java / Spring Boot)
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
           PostgreSQL       Redis         Kafka
            order_db     (Order Cache) (order.events)
                │
                ├───────────────────────────────────────┐
                ▼                                       ▼
        [Transactional Outbox]                  [Saga Coordinator]
                │                                       │
                ▼ (Outbox Worker)              ┌────────┴────────┐
          Kafka Events                         ▼                 ▼
                                         Cart Service     Inventory Service
                                       (Get/Clear Cart)   (Reserve/Confirm/Release)
```

---

## 4. API Endpoints

### Customer Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Checkout and create order from cart | Yes (Bearer JWT) |
| `GET` | `/api/v1/orders` | List current customer's orders (paginated) | Yes (Bearer JWT) |
| `GET` | `/api/v1/orders/{id}` | Get order details by ID | Yes (Bearer JWT) |
| `POST` | `/api/v1/orders/{id}/cancel` | Cancel order & release reserved inventory | Yes (Bearer JWT) |
| `GET` | `/api/v1/orders/{id}/history` | Get order status change audit trail | Yes (Bearer JWT) |
| `POST` | `/api/v1/orders/{id}/payment-callback` | Webhook for payment success/failure | Optional / Yes |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/admin/orders` | List all platform orders (paginated, filtered) | Yes (Admin) |
| `GET` | `/api/v1/admin/orders/{id}` | View any order details | Yes (Admin) |
| `PATCH` | `/api/v1/admin/orders/{id}/status` | Update order status (`SHIPPED`, etc.) | Yes (Admin) |

### Health Check
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health & Liveness Probe | No |

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
docker-compose up -d postgres-order redis-order kafka-order

# 2. Run with Maven
mvn spring-boot:run
```

### Running Tests
```bash
mvn test
```

### OpenAPI Documentation
Once running, browse to: `http://localhost:8087/swagger-ui.html`
