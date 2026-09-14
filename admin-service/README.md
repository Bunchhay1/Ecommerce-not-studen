# Admin Service (Core #15)

The **Admin Service** is the central management and control plane microservice for the entire E-Commerce Microservices ecosystem. It provides unified administrative visibility, fine-grained role-based access control (RBAC), immutable audit logging, operational dashboards, and safe downstream orchestration across all microservices.

---

## Architecture Principles

1. **No Direct Foreign Database Access**: The Admin Service never accesses `order_db`, `catalog_db`, `seller_db`, or any downstream databases directly. All actions are performed strictly via downstream REST APIs or Kafka events to preserve microservice domain autonomy.
2. **Centralized Identity & Authentication**: The Admin Service validates Bearer JWT tokens issued by `auth-service` and layers internal granular permissions and administrative user statuses.
3. **Immutable Append-Only Audit Logging**: Every mutating administrative action (`SELLER_SUSPENDED`, `ORDER_CANCELLED`, `ORDER_REFUNDED`, `PRODUCT_APPROVED`, `INVENTORY_ADJUSTED`, etc.) is recorded with `adminUserId`, `action`, `resourceType`, `resourceId`, `oldValue`, `newValue`, `reason`, `ipAddress`, and `requestId`.
4. **Dangerous Operations & Idempotency**: High-risk financial or stock mutations support the `Idempotency-Key` HTTP header to prevent accidental duplicate actions.

---

## Tech Stack & Port Allocation

- **Language & Runtime**: TypeScript / Node.js
- **Framework**: NestJS (Fastify/Express compatible)
- **Database**: PostgreSQL (`admin_db` on port `5446`)
- **Cache**: Redis (`admin_redis` on port `6393`)
- **Message Broker**: Apache Kafka (port `9092`)
- **ORM**: Prisma ORM
- **Service Port**: `8015`
- **Documentation**: Swagger UI at `http://localhost:8015/swagger-ui`

---

## Role-Based Access Control (RBAC) Matrix

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform owner | All permissions across all domains |
| `ADMIN` | General operations admin | User, Seller, Catalog, Order, Inventory, and Promotion management |
| `SUPPORT` / `CUSTOMER_SUPPORT` | Customer care agent | User read, Order read/update/cancel, Payment read, Seller read |
| `CATALOG_ADMIN` | Catalog manager | Product CRUD, Category curation, Product approval/archiving |
| `SELLER_ADMIN` | Seller manager | Seller verification, status updates, commission rule assignment |
| `ORDER_ADMIN` | Order fulfillment lead | Order search, cancellations, refunds, status corrections |
| `FINANCE_ADMIN` | Financial auditor | Payment inspection, gateway refunds, commission inspection |
| `MARKETING_ADMIN` | Growth & Marketing | Coupons, promotional campaigns, announcement broadcasts |
| `MODERATOR` | Content reviewer | Review moderation, spam removal, product listing audits |

---

## Downstream Orchestration Endpoints

| Domain | Downstream Microservice | Admin Endpoints |
| :--- | :--- | :--- |
| **Users** | User Service (`:8002`) | `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id/status` |
| **Sellers** | Seller Marketplace Service (`:8014`) | `GET /api/v1/admin/sellers`, `POST :id/verify`, `PATCH :id/status` |
| **Catalog** | Catalog Service (`:8003`) | `GET /api/v1/admin/catalog/products`, `POST :id/approve`, `DELETE :id` |
| **Orders** | Order Service (`:8005`) | `GET /api/v1/admin/orders`, `POST :id/cancel`, `POST :id/refund` |
| **Inventory** | Inventory Service (`:8006`) | `GET /api/v1/admin/inventory`, `POST :variantId/adjust` |
| **Payments** | Payment Service (`:8007`) | `GET /api/v1/admin/payments`, `POST :id/refund` |
| **Reviews** | Review Service (`:8012`) | `GET /api/v1/admin/reviews`, `POST :id/status`, `DELETE :id` |
| **Promotions** | Promotion Service (`:8011`) | `GET /api/v1/admin/promotions`, `POST /`, `PATCH :id/status` |
| **Notifications**| Notification Service (`:8009`) | `GET /api/v1/admin/notifications`, `POST /broadcast` |
| **Audit Logs** | Local Database (`admin_db`) | `GET /api/v1/admin/audit-logs`, `GET :id` |
| **Dashboard** | Aggregated Control Plane | `GET /api/v1/admin/dashboard/summary`, `/alerts`, `/trends` |
| **Search** | Unified Cross-Domain Search | `GET /api/v1/admin/search?q=...` |

---

## Local Development & Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- Docker & Docker Compose (optional for local DB/Redis)

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Docker Infrastructure (Postgres, Redis)
```bash
docker-compose up -d postgres redis
```

### 5. Seed Permissions & Roles
```bash
npm run prisma:seed
```

### 6. Run Service
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 7. Run Unit Tests
```bash
npm test
```
