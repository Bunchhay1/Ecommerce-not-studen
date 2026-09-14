# Cart Service — Core Service #05

## 1. Overview

The **Cart Service** manages customer shopping carts before checkout in the E-Commerce Microservices ecosystem.

### Responsibilities:
- Create and retrieve customer shopping carts (persisted across sessions).
- Add products and variants to cart with atomic deduplication.
- Update item quantities with real-time subtotal re-calculation.
- Remove products or clear entire cart.
- Validate pricing & availability against **Catalog Service** (preventing client-side tampering).
- Cache active carts in **Redis** with TTL for fast access.
- Publish real-time events to **Kafka** (`CartCreated`, `CartItemAdded`, `CartItemUpdated`, `CartItemRemoved`, `CartCleared`, `CartStatusChanged`).
- Maintain cart lifecycle statuses (`ACTIVE`, `CHECKOUT`, `CONVERTED`, `ABANDONED`, `EXPIRED`).

---

## 2. Technology Stack

- **Language & Runtime:** TypeScript / Node.js
- **Framework:** NestJS 10.x
- **ORM & Database:** Prisma ORM / PostgreSQL (`cart_db`)
- **Caching:** Redis (`ioredis`)
- **Event Streaming:** Apache Kafka (`kafkajs`)
- **Validation:** Jakarta / `class-validator`, `class-transformer`
- **Security:** JWT Authentication Guard (`@nestjs/passport`, `passport-jwt`, `jsonwebtoken`)
- **Testing:** Jest + Supertest
- **Documentation:** Swagger / OpenAPI (`@nestjs/swagger`)

---

## 3. Architecture & Data Model

```
                    ┌───────────────────────────┐
                    │       API Gateway         │
                    └─────────────┬─────────────┘
                                  │ (JWT Auth)
                                  ▼
                    ┌───────────────────────────┐
                    │       Cart Service        │
                    │         (NestJS)          │
                    └──┬───────┬─────────────┬──┘
                       │       │             │
        (Validate Price)       │             │
                       ▼       ▼             ▼
       ┌────────────────┐  ┌───────┐   ┌───────────┐
       │ Catalog Service│  │ Redis │   │PostgreSQL │
       └────────────────┘  └───────┘   └───────────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ Kafka Topics  │
                       │ (cart-events) │
                       └───────────────┘
```

### PostgreSQL Schema (`prisma/schema.prisma`)
```prisma
enum CartStatus {
  ACTIVE
  CHECKOUT
  CONVERTED
  ABANDONED
  EXPIRED
}

model Cart {
  id          String      @id @default(uuid())
  userId      String      @unique @map("user_id")
  status      CartStatus  @default(ACTIVE)
  subtotal    Decimal     @default(0.00) @db.Decimal(12, 2)
  items       CartItem[]
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@map("carts")
}

model CartItem {
  id          String   @id @default(uuid())
  cartId      String   @map("cart_id")
  cart        Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId   String   @map("product_id")
  variantId   String   @map("variant_id")
  productName String   @map("product_name")
  sku         String
  unitPrice   Decimal  @map("unit_price") @db.Decimal(12, 2)
  quantity    Int      @default(1)
  subtotal    Decimal  @default(0.00) @db.Decimal(12, 2)
  imageUrl    String?  @map("image_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([cartId, variantId])
  @@map("cart_items")
}
```

---

## 4. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Get current user's active cart | Yes (Bearer JWT) |
| `POST` | `/api/v1/cart/items` | Add item to cart (with catalog validation) | Yes (Bearer JWT) |
| `PUT` | `/api/v1/cart/items/:itemId` | Update item quantity in cart | Yes (Bearer JWT) |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove specific item from cart | Yes (Bearer JWT) |
| `DELETE` | `/api/v1/cart` | Clear all items in active cart | Yes (Bearer JWT) |
| `PATCH` | `/api/v1/cart/status` | Update cart status (e.g. `CHECKOUT`, `ABANDONED`) | Yes (Bearer JWT) |
| `GET` | `/api/v1/health` | Service liveness / readiness check | No |

---

## 5. Kafka Events Published

Topic: `cart-events`

- `CartCreated`: Fired when a new cart is initialized for a user.
- `CartItemAdded`: Fired when a product variant is added to the cart.
- `CartItemUpdated`: Fired when an item quantity is updated.
- `CartItemRemoved`: Fired when an item is removed.
- `CartCleared`: Fired when a user empties their cart.
- `CartStatusChanged`: Fired when cart status transitions (e.g. `ACTIVE` -> `CHECKOUT`).

---

## 6. Running the Service

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- Kafka (Optional for local development / mocked in tests)

### Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply Migrations
npx prisma migrate dev --name init

# 4. Run Development Server
npm run start:dev
```

### Running Tests
```bash
npm test
```

### Docker
```bash
docker-compose up --build
```
