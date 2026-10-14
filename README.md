# E-Commerce Marketplace — Complete Architecture

A production-grade, enterprise-ready **Amazon-like multi-vendor E-Commerce Marketplace** featuring **2 separate frontends** (Customer Frontend + Company Frontend), **1 API Gateway**, and **15 backend microservices**. Built with clean domain boundaries, event-driven decoupling via **Apache Kafka**, sub-millisecond caching with **Redis**, and isolated single-service **PostgreSQL** databases.

📖 **Authoritative Master Reference**: For the complete 50-section architectural specification, see **[`docs/COMPLETE_ARCHITECTURE.md`](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/COMPLETE_ARCHITECTURE.md)**.
🚀 **Master Operational Runbook**: For step-by-step local execution of all 17 microservices & infrastructure, see **[`docs/RUNNING_SERVICES_MASTER_RUNBOOK.md`](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/RUNNING_SERVICES_MASTER_RUNBOOK.md)**.
🎨 **Frontend Multi-Actor Reference**: For role separation, route protection, and UX matrix, see **[`docs/FRONTEND_ARCHITECTURE.md`](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/FRONTEND_ARCHITECTURE.md)**.

---

## 📐 System Architecture

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
                    │                   ┌───────┴───────┐
                    │                   │               │
                    │                SELLER           ADMIN
                    │                   │               │
                    └─────────────┬─────┴───────────────┘
                                  │
                                  ▼
                           API GATEWAY :8000
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
       ▼                          ▼                          ▼
 Customer APIs              Seller APIs                 Admin APIs
       │                          │                          │
       └──────────────────────────┼──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
               REST / HTTP                    Kafka
                Synchronous                Asynchronous
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
   Object Storage (S3/MinIO)
```

---

## 🌟 The 7 Golden Architectural Rules

1. **Frontends talk only to the API Gateway** (`http://localhost:8000`). Direct browser communication to internal backend services, databases, Redis, or Kafka is strictly prohibited.
2. **API Gateway never touches databases directly**; it is solely an edge reverse proxy, rate limiter, circuit breaker, CORS enforcer, and JWT authenticator.
3. **Zero Cross-Service Database Access**: Each service exclusively owns its database and schema. Cross-domain queries are strictly mediated via REST or Kafka events.
4. **REST for immediate synchronous operations; Kafka for asynchronous decoupled events**.
5. **Idempotent Consumers**: Every event listener tracks and deduplicates using unique `eventId`s.
6. **Transactional Outbox Pattern**: Local state mutations paired with event publication are committed in the same database transaction.
7. **Checkout Saga**: Multi-service order placement uses an orchestrated Saga pattern with compensating rollback transactions, never distributed 2PC transactions.
8. **The 4-Question UI Design Sequence**: Every UI component must be derived strictly via `WHO ➔ WHAT ➔ SERVICE ➔ API ➔ DATABASE/EVENT`. Never start with the API out of convenience; always derive from business domain ownership.

---

## 🗂️ Complete Services Portfolio (00–17)

| # | Service Directory | Language / Framework | Port | Primary Responsibility |
| :-: | :--- | :--- | :-: | :--- |
| **00** | [`frontend` (Customer)](file:///Users/chhay/Desktop/E-Commerce-Microservice/frontend) | Next.js 14 / TypeScript | `3000` | Customer shopping storefront (`shop.example.com`) |
| **01** | [`frontend` (Company)](file:///Users/chhay/Desktop/E-Commerce-Microservice/frontend) | Next.js 14 / TypeScript | `3001` | Seller + Admin management portal (`company.example.com`) |
| **02** | [`api-gateway`](file:///Users/chhay/Desktop/E-Commerce-Microservice/api-gateway) | Go 1.22 / Gin | `8000` | Edge reverse proxy, JWT validation, rate limiting, routing |
| **03** | [`auth-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/auth-service) | Python 3.11 / FastAPI | `8001` | Identity, JWT tokens, password hashing, roles & permissions |
| **04** | [`user-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/user-service) | Go 1.22 / Gin | `8002` | User profiles, address books, account preferences |
| **05** | [`catalog-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/catalog-service) | Java 21 / Spring Boot 3 | `8003` | Product catalog, multi-level categories, brands, variants, SKUs |
| **06** | [`search-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/search-service) | Python 3.11 / FastAPI | `8004` | OpenSearch integration, faceted search, auto-complete indexing |
| **07** | [`cart-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/cart-service) | TypeScript / NestJS | `8005` | High-throughput shopping carts, Redis item management |
| **08** | [`inventory-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/inventory-service) | Java 21 / Spring Boot 3 | `8006` | Stock tracking, soft reservations, warehouse allocations |
| **09** | [`order-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/order-service) | Java 21 / Spring Boot 3 | `8007` | Checkout Saga orchestrator, order lifecycle & address snapshots |
| **10** | [`payment-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/payment-service) | C# / ASP.NET Core 8 | `8008` | Payment intent processing, Stripe/PayPal webhooks, refunds |
| **11** | [`shipping-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/shipping-service) | TypeScript / NestJS | `8009` | Carrier integration, parcel tracking, delivery dispatch |
| **12** | [`promotion-pricing-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/promotion-pricing-service) | Python 3.11 / FastAPI | `8010` | Dynamic pricing engine, discount rules, sales campaigns |
| **13** | [`review-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/review-service) | TypeScript / NestJS | `8011` | Product ratings, sentiment analysis, verified buyer checks |
| **14** | [`notification-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/notification-service) | Elixir / Phoenix | `8012` | Real-time push, SMS, transactional email broadcast via Oban |
| **15** | [`recommendation-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/recommendation-service) | Python 3.11 / FastAPI | `8013` | Machine learning collaborative filtering, trending products |
| **16** | [`seller-marketplace-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/seller-marketplace-service) | Java 21 / Spring Boot 3 | `8014` | Merchant stores, commission structures, seller offers & listings |
| **17** | [`admin-service`](file:///Users/chhay/Desktop/E-Commerce-Microservice/admin-service) | TypeScript / NestJS | `8015` | Control plane, governance, user/merchant moderation, audit logs |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Docker & Docker Compose** (for PostgreSQL, Redis, Kafka, OpenSearch)
- **Go 1.22+**, **Node.js 20+**, **Python 3.11+**, **Java 21**, **.NET 8 SDK**, **Elixir 1.16+**

### 1. Launch Shared Infrastructure
```bash
docker compose up -d postgres redis kafka opensearch
```

### 2. Start the API Gateway
```bash
cd api-gateway
go run cmd/server/main.go
```
The gateway will start on `http://localhost:8000` and route all public traffic to downstream microservices.

### 3. Launch Frontend Clients
```bash
cd frontend
npm install

# Customer Frontend (Port 3000):
npm run dev

# Company Frontend (Port 3001):
npm run dev -- -p 3001
```
- Open `http://localhost:3000` for the Customer shopping storefront (`shop.example.com`).
- Open `http://localhost:3001` for the Seller + Admin management portal (`company.example.com`).

---

## 📚 Complete Architectural Documentation
- [Developer Workflow & Operations Guide (M3 Pro & Cambodia)](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/DEVELOPMENT_GUIDE.md)
- [Authoritative 50-Section Architecture Specification](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/COMPLETE_ARCHITECTURE.md)
- [UI / API Integration & Service Ownership Matrix](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/UI_API_INTEGRATION.md)
- [Cambodia Production Seed Data Specification](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/CAMBODIA_PRODUCTION_SEED_DATA.md)
- [Frontend Multi-Actor Architecture & Route Protection](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/FRONTEND_ARCHITECTURE.md)
- [Service Communication Protocol & Event Contracts](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/SERVICE_COMMUNICATION.md)
- [16-Core Server Auto-Deployment Documentation](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/DEPLOYMENT.md)
- [Frontend Live Auto-Deployment Documentation](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/FRONTEND_DEPLOYMENT.md)
- [Production Deployment Automation & Compose](file:///Users/chhay/Desktop/E-Commerce-Microservice/deploy)
- [API Gateway Reverse Proxy Configuration](file:///Users/chhay/Desktop/E-Commerce-Microservice/api-gateway/configs/config.yaml)
- [Checkout Saga Sequence & Compensation Plan](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/SERVICE_COMMUNICATION.md#6-checkout-saga--end-to-end-purchase-flow)

