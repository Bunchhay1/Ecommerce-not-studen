# E-Commerce Frontend — Live Auto Deployment

A dedicated, automated deployment workflow and architectural specification for the **Next.js + TypeScript** frontend, separated from the backend microservices lifecycle while unifying under the same CI/CD pipeline.

---

## 1. Frontend Stack & Production Architecture

### Frontend Stack
```
Frontend
├── Next.js 14 (App Router)
├── TypeScript
├── Tailwind CSS
├── shadcn/ui
├── Framer Motion
└── Zustand
```

### Production Architecture
```
                    INTERNET
                       │
                       ▼
                  Cloudflare
                 / CDN / WAF
                       │
                       ▼
                    Nginx
                       │
                       ▼
                Next.js Frontend
                       │
                       ▼
                  API Gateway
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Auth          Catalog          Search
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  Microservices
```

---

## 2. Frontend Does NOT Connect Directly to Databases

> [!CRITICAL]
> **Strict Boundary Enforcement**: The frontend runs in a distinct untrusted client network tier and must never hold database credentials or direct sockets to backing datastores.

```
❌ Next.js → PostgreSQL
❌ Next.js → Redis
❌ Next.js → Kafka
❌ Next.js → inventory_db

✅ Next.js → API Gateway (:8000) → Microservices
```

The browser and Next.js SSR functions communicate exclusively with the public API Gateway layer.

---

## 3. Frontend Request Flow

### Product Page Composition
```
Customer
   │
   ▼
Next.js
   │
   ▼ HTTPS
API Gateway
   │
   ├──► Catalog Service     (Product & variant definitions)
   ├──► Pricing Service     (Live variant price & promotions)
   ├──► Inventory Service   (Stock availability)
   ├──► Review Service      (Product ratings & buyer reviews)
   └──► Recommendation Svc  (Related / frequently bought together)
```

### Checkout Flow
```
Browser
   │
   ▼
Next.js
   │
   ▼
API Gateway
   │
   ▼
Order Service (Checkout Orchestrator)
   │
   ├── Cart Service         (Authoritative items)
   ├── Pricing Service      (Tax, discounts, total)
   ├── Inventory Service    (Stock reservation)
   ├── Payment Service      (Payment intent creation)
   └── Shipping Service     (Consignment creation)
```

> The **Order Service**, not the frontend, governs the state machine, validations, and rollback compensation of the checkout workflow.

---

## 4. Frontend Project Structure

```
frontend/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── orders/
│   │
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── account/
│   │   ├── profile/
│   │   ├── addresses/
│   │   └── orders/
│   │
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   └── layout/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   └── utils/
│
├── stores/
│   ├── cart-store.ts
│   ├── auth-store.ts
│   └── ui-store.ts
│
├── hooks/
├── types/
├── config/
├── public/
├── tests/
├── Dockerfile
├── next.config.mjs
├── package.json
└── .env.example
```

---

## 5. Environment Variables

| Environment | Config File | Purpose |
| :--- | :--- | :--- |
| **Development** | `.env.local` | Local mocks or developer gateway (`http://localhost:8000`) |
| **Production** | `.env.production` | Live CDN and Gateway URLs |

### Production Configuration Example
```ini
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://example.com
```

> [!CAUTION]
> **Zero Secrets in `NEXT_PUBLIC_*`**: Any environment variable prefixed with `NEXT_PUBLIC_` is inlined into the client-side JavaScript bundle during build time. Never expose database passwords, secret keys, or internal private tokens in `NEXT_PUBLIC_*`.

---

## 6. API Client (`lib/api/client.ts`)

Centralized HTTP client enforcing consistent headers, error propagation, and tracing:

```
Component / Page
       │
       ▼
API Client (`lib/api/client.ts`)
       │
       ▼
  API Gateway
       │
       ▼
Backend Microservice
```

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}
```

---

## 7. Frontend Authentication

```
Login Screen
    │
    ▼
Next.js API Route / Action
    │
    ▼
API Gateway
    │
    ▼
Auth Service
    │
    ▼
JWT / Secure Session Cookies
```

For browser security, avoid storing long-lived JWTs in `localStorage` (vulnerable to XSS). Utilize secure session cookies configured with:
- `HttpOnly` (inaccessible to JavaScript)
- `Secure` (transmitted solely over TLS/HTTPS)
- `SameSite=Lax` or `Strict` (CSRF defense)

---

## 8. Frontend State Management

Use **Zustand** for client-side ephemeral UI state, not as an in-memory replica of backend databases:

```
Zustand State Scope:
├── Cart UI state & slide drawer toggle
├── Selected product variant / color / size
├── Facet filter selections & search parameters
├── Modal dialog states
├── Authentication UI session indicators
└── Multi-step checkout form step tracking
```

Server data should originate from server-side rendering (SSR), Incremental Static Regeneration (ISR), or SWR/React Query caching.

---

## 9. Product Page Composition

```
Product Page
     │
     ├── Product information  ──► Catalog Service
     │
     ├── Current price        ──► Pricing Service
     │
     ├── Stock availability   ──► Inventory Service
     │
     ├── Customer reviews     ──► Review Service
     │
     └── Similar items        ──► Recommendation Service
```

*(For ultra-low latency, the API Gateway can expose an aggregated composition endpoint such as `GET /api/v1/store/products/{id}` to prevent five separate client round-trips).*

---

## 10. Multi-Stage Production Dockerfile

Using Next.js `output: "standalone"` to create a minimal container image:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy minimal standalone server artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 11. Production Docker Compose Service Definition

```yaml
services:
  frontend:
    image: ${REGISTRY:-ecommerce}/frontend:${VERSION:-latest}
    container_name: ecommerce-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.example.com
      - PORT=3000
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 2048M
    stop_grace_period: 15s
```

---

## 12. Edge Nginx Ingress & Routing

```
Internet
   │
   ▼
Nginx (:443 TLS)
   │
   ├── example.com      ──► Next.js Frontend (:3000)
   │
   └── api.example.com  ──► API Gateway (:8000)
```

### Nginx Configuration Snippet:
```nginx
# Customer Storefront
server {
    listen 443 ssl http2;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# Public API Gateway
server {
    listen 443 ssl http2;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 13. Frontend Auto-Deployment Pipeline

```
Developer
    │
    ▼
git push main
    │
    ▼
GitHub Actions
    │
    ├── npm ci
    ├── lint
    ├── typecheck
    ├── test
    ├── build
    │
    ▼
Docker Image
    │
    ▼
Docker Registry
    │
    ▼
Production Server
    │
    ▼
deploy-frontend.sh
    │
    ▼
Health Check
    │
 ┌──┴──┐
PASS  FAIL
 │      │
 ▼      ▼
LIVE  ROLLBACK
```

---

## 14. Dedicated `deploy-frontend.sh` Script

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_DIR="/opt/ecommerce/deploy"
LOCK_FILE="/tmp/ecommerce-frontend-deploy.lock"

echo "========================================="
echo " E-Commerce Frontend Deployment"
echo " Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================="

# Acquire lock
exec 8>"$LOCK_FILE"
if ! flock -n 8; then
    echo "ERROR: Another frontend deployment is in progress."
    exit 1
fi

cd "$DEPLOY_DIR"

echo "[1/4] Pulling latest frontend container image..."
docker compose -f docker-compose.prod.yml pull frontend

echo "[2/4] Performing zero-downtime container rolling restart..."
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

echo "[3/4] Waiting 15s for Next.js server initialization..."
sleep 15

echo "[4/4] Verifying frontend health probe..."
if docker compose -f docker-compose.prod.yml ps frontend | grep -qE "Up|running" && \
   curl -s -f -m 5 "http://localhost:3000" > /dev/null; then
    echo "SUCCESS: Frontend deployment is healthy and LIVE."
else
    echo "ALERT: Frontend health check failed! Initiating rollback..."
    if [ -f "./rollback-frontend.sh" ]; then
        ./rollback-frontend.sh
    fi
    exit 1
fi
```

---

## 15. Frontend CI Pipeline Validation

```yaml
- name: Install dependencies
  run: npm ci

- name: Lint
  run: npm run lint

- name: Type check
  run: npx tsc --noEmit

- name: Unit Tests
  run: npm test --if-present

- name: Build Standalone
  run: npm run build
```

Only when all validation steps pass does the workflow proceed to Docker build, container registry publication, and server deployment trigger.

---

## 16. Frontend Immutable Tagging & Rollback

```
Current: frontend:2026.09.13-b81c20
   ↓
Deploy:  frontend:2026.09.14-a82f91
   ↓ (Health Check FAILED)
Rollback:
   ↓
Revert to: frontend:2026.09.13-b81c20
   ↓
LIVE
```

Always use immutable semantic commit tags (`frontend:YYYY.MM.DD-<commit_sha>`) rather than mutable `frontend:latest`.

---

## 17. Frontend vs. Backend Independent Deployment

```
Frontend Changed:
Frontend ──► CI ──► Build ──► Deploy Frontend
(All 16 backend microservices and databases stay running without interruption)

Order Service Changed:
Order Service ──► CI ──► Build ──► Deploy Order Service
(Frontend and all other microservices stay running without interruption)

Catalog Changed:
Catalog Service ──► Deploy Catalog ──► Kafka events ──► Search index updated
(Zero frontend rebuild or restart required)
```

---

## 18. 16-Core Server Resource Allocation for Frontend

| Resource | Recommended Allocation | Reason |
| :--- | :--- | :--- |
| **CPU** | `1.5 Cores` | Fast SSR rendering and React component streaming |
| **RAM** | `2048 MB (2 GB)` | Page cache and Node.js V8 runtime heap |

By capping the frontend at 1.5 CPUs and 2 GB RAM, the remaining ~14.5 cores and 30–62 GB of system memory are preserved for PostgreSQL, Kafka, OpenSearch, and Java business microservices.

---

## 19. Frontend Real-Time & User-Centric Monitoring

### Server-Side Telemetry:
- SSR response time (p50, p95, p99)
- HTTP 4xx & 5xx error rates
- Container CPU & RAM utilization
- Node.js event loop lag & garbage collection pauses

### Core Web Vitals (Client-Side Real User Monitoring):
- **LCP (Largest Contentful Paint)**: $< 2.5\text{s}$ (Good)
- **INP (Interaction to Next Paint)**: $< 200\text{ms}$ (Good)
- **CLS (Cumulative Layout Shift)**: $< 0.1$ (Good)
- **FCP (First Contentful Paint)**: $< 1.8\text{s}$ (Good)

---

## 20. Final Live Architecture Overview

```
                         CUSTOMER
                            │
                            ▼
                     ┌─────────────┐
                     │ Cloudflare  │
                     │  CDN / WAF  │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Nginx    │
                     │ HTTPS / TLS │
                     └──────┬──────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          ┌─────────────┐       ┌─────────────┐
          │   Next.js   │       │ API Gateway │
          │  Frontend   │       │   Go/Gin    │
          └─────────────┘       └──────┬──────┘
                                       │
          ┌────────────────────────────┼──────────────────────────┐
          │                            │                          │
          ▼                            ▼                          ▼
       Auth/User                 Catalog/Search              Cart/Order
          │                            │                          │
          └────────────────────────────┼──────────────────────────┘
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                       Payment     Inventory     Shipping
                          │            │            │
                          └────────────┼────────────┘
                                       ▼
                                     Kafka
                                       │
                 ┌─────────────────────┼────────────────────┐
                 ▼                     ▼                    ▼
             Notification        Recommendation         Seller
                                       │
                                       ▼
                                  OpenSearch

                 PostgreSQL = Source of truth
                 Redis      = Cache & Ephemeral state
                 Kafka      = Event backbone
                 S3/GCS     = Media & Product imagery
```

---

## The Production Rule to Lock In

- **Frontend**: `Next.js → Docker → GitHub Actions → Registry → Health Check → Live / Rollback`
- **Backend**: `15 Microservices → Independent Docker Images → Independent Deployments → REST + Kafka`
- **Infrastructure**: `PostgreSQL, Redis, Kafka, OpenSearch` remain persistently online and are **never** recreated during frontend or single-service deployments.
