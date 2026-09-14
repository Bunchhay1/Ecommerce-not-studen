# Core #16 — API Gateway (Go + Gin)

High-performance, low-latency API Gateway implemented in **Go** using the **Gin** web framework. Serves as the single public entry point for all 15 microservices across the E-Commerce platform.

---

## 1. Architecture Overview

```
                        ┌────────────────────────┐
                        │   Web / Mobile / Apps  │
                        └───────────┬────────────┘
                                    │ HTTPS (Port 8000)
                                    ▼
                        ┌────────────────────────┐
                        │      API GATEWAY       │
                        │      (Go + Gin)        │
                        └───────────┬────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
01 Auth Service (:8001)       02 User Service (:8002)         03 Catalog Service (:8003)
04 Search Service (:8004)     05 Cart Service (:8005)         06 Inventory Service (:8006)
07 Order Service (:8007)      08 Payment Service (:8008)      09 Shipping Service (:8009)
10 Promotion Service (:8010)  11 Review Service (:8011)       12 Notification Service (:8012)
13 Recommendation (:8013)     14 Seller Service (:8014)       15 Admin Service (:8015)
```

### Core Responsibilities
- **Single Public API Entry Point**: Unified ingress on port `8000`.
- **Zero Business Logic & Clean Boundaries**: Does not access any business databases directly. Downstream services maintain full data autonomy.
- **JWT Validation & Header Sanitization**:
  - Strips incoming client-supplied `X-User-ID`, `X-User-Roles`, `X-User-Email` to prevent header spoofing.
  - Verifies token signature and expiration.
  - Injects verified claims downstream as trusted headers: `X-User-ID`, `X-User-Roles`, `X-User-Email`.
- **Tiered Rate Limiting**:
  - Login/Register: 5 req/min
  - Search: 100 req/min
  - Admin: 100 req/min
  - Standard Default: 300 req/min
  - Backed by Redis with automatic, transparent in-memory token bucket fallback.
- **Circuit Breaking**: Per-upstream failure tracking with automatic circuit tripping to prevent cascading downstream outages.
- **Distributed Correlation**: `X-Request-ID` generation or preservation on every hop.
- **Observability**: Prometheus metrics at `/metrics`, structured JSON logging with `slog`, and health endpoints (`/health`, `/health/live`, `/health/ready`).

---

## 2. Upstream Route Mapping

| Public Gateway Path | Downstream Microservice | Default Target | Authentication |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/*` | Auth Service | `http://localhost:8001` | Public / Hybrid |
| `/api/v1/users/*` | User Service | `http://localhost:8002` | Protected |
| `/api/v1/products/*` | Catalog Service | `http://localhost:8003` | Public |
| `/api/v1/categories/*` | Catalog Service | `http://localhost:8003` | Public |
| `/api/v1/search/*` | Search Service | `http://localhost:8004` | Public |
| `/api/v1/cart/*` | Cart Service | `http://localhost:8005` | Optional Auth |
| `/api/v1/inventory/*` | Inventory Service | `http://localhost:8006` | Protected |
| `/api/v1/orders/*` | Order Service | `http://localhost:8007` | Protected |
| `/api/v1/payments/*` | Payment Service | `http://localhost:8008` | Protected |
| `/api/v1/shipping/*` | Shipping Service | `http://localhost:8009` | Protected |
| `/api/v1/promotions/*` | Promotion Service | `http://localhost:8010` | Public |
| `/api/v1/pricing/*` | Pricing Service | `http://localhost:8010` | Public |
| `/api/v1/reviews/*` | Review Service | `http://localhost:8011` | Public |
| `/api/v1/notifications/*` | Notification Service | `http://localhost:8012` | Protected |
| `/api/v1/recommendations/*` | Recommendation Service | `http://localhost:8013` | Public |
| `/api/v1/sellers/*` | Seller Service | `http://localhost:8014` | Public / Hybrid |
| `/api/v1/admin/*` | Admin Service | `http://localhost:8015` | Protected (Admin Roles) |

---

## 3. Standard Error Format

Consistent error envelopes are returned across all gateway failure modes:

```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service 'payment-service' is temporarily unavailable due to upstream errors"
  },
  "requestId": "8f92c2a0-4b3d-4c8e-9d2a-1b2c3d4e5f6a"
}
```

---

## 4. Getting Started

### Local Development
```bash
cd api-gateway

# Run unit and integration tests
go test -v ./tests/...

# Build executable
go build -o bin/api-gateway cmd/server/main.go

# Run gateway
./bin/api-gateway
```

### Run with Docker Compose
```bash
docker-compose up --build -d
```

### Health & Metrics Endpoints
- **Health**: `http://localhost:8000/health`
- **Liveness**: `http://localhost:8000/health/live`
- **Readiness**: `http://localhost:8000/health/ready`
- **Prometheus Metrics**: `http://localhost:8000/metrics`
