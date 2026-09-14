# Shipping Service — Core Service #09

## 1. Overview
The **Shipping Service** manages the delivery and shipment lifecycle for customer orders in the e-commerce marketplace.

### Responsibilities
- Create shipments with carrier selection (`DHL`, `FedEx`, `UPS`, `LOCAL`)
- Support 1 Order $\rightarrow$ N Shipments (for multi-warehouse or multi-seller fulfillment)
- Snapshot immutable shipping addresses at order fulfillment time
- Track item details inside each parcel (`shipment_items`)
- Shipment status state machine (`PENDING`, `CREATED`, `READY_FOR_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNING`, `RETURNED`, `CANCELLED`, `LOST`)
- Human-readable shipment number `SHP-YYYYMMDD-XXXXXX` and carrier tracking numbers
- Tracking progression history (`tracking_events`)
- Estimate shipping fees by shipping method (`STANDARD`, `EXPRESS`, `SAME_DAY`, `NEXT_DAY`, `PICKUP`)
- Verify and process carrier webhooks with idempotency (`shipping_webhook_events`)
- Transactional Outbox Pattern (`outbox_events`) publishing to Kafka topic `shipping.events`
- Redis caching for shipment status and rates
- JWT Bearer Authentication and role-based access (`ROLE_CUSTOMER`, `ROLE_ADMIN`)

## 2. Technology Stack
- **Language**: TypeScript / Node.js
- **Framework**: NestJS 10
- **Database**: PostgreSQL (`shipping_db`) via Prisma ORM
- **Cache**: Redis (`shipment:{id}`, `tracking:{id}`, `shipping:rates:{city}:{country}`)
- **Event Broker**: Apache Kafka (`shipping.events`) via `kafkajs`
- **Testing**: Jest + ts-jest
- **Documentation**: Swagger / OpenAPI 3 (`/docs`)

## 3. Main API Endpoints

### Customer & Order Endpoints
- `POST /api/v1/shipments`: Create shipment for order (supports `idempotencyKey`)
- `GET /api/v1/shipments`: List customer's shipments (paginated)
- `GET /api/v1/shipments/{id}`: Get shipment details by ID
- `GET /api/v1/shipments/order/{orderId}`: Get all shipments for an order
- `POST /api/v1/shipments/{id}/cancel`: Cancel a shipment before transit
- `GET /api/v1/shipments/{id}/tracking`: Get tracking events history
- `GET /api/v1/shipments/tracking/{trackingNumber}`: Public tracking lookup
- `GET /api/v1/shipping/rates`: Calculate estimated shipping rates

### Webhooks
- `POST /api/v1/shipping/webhooks/{provider}`: Carrier webhook updates (`dhl`, `fedex`, `ups`) with signature verification

### Admin Endpoints
- `GET /api/v1/admin/shipments`: List all shipments (paginated, with status filter)
- `GET /api/v1/admin/shipments/{id}`: View shipment
- `PATCH /api/v1/admin/shipments/{id}/status`: Update shipment status and emit tracking event

### Health Checks
- `GET /health`, `GET /health/live`, `GET /health/ready`, `GET /api/v1/health`

## 4. Running & Testing Locally
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run test suite
npm test

# Start in development mode
npm run start:dev
```
