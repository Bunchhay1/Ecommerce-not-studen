# NovaMarket Frontend — Multi-Actor Next.js Application

Next-generation e-commerce web platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Framer Motion**, and **Zustand**. 

The frontend provides **3 distinct actor experiences within a single unified codebase**, connecting exclusively through **API Gateway #16** (`http://localhost:8000`).

---

## 1. Unified Codebase, Three Experiences

```
                         FRONTEND
                    Next.js + TypeScript
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
         CUSTOMER         SELLER         ADMIN
        EXPERIENCE      PORTAL        CONTROL PLANE
         (/shop)         (/seller)      (/admin)
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                      API GATEWAY
                     Port 8000 (Go)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     Customer APIs     Seller APIs       Admin APIs
   13 Business Svc   Seller Service    Admin Service
                         (#15)             (#16)
```

For complete architectural specifications, see **[Frontend Architecture Documentation](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/FRONTEND_ARCHITECTURE.md)**.

---

## 2. Actor Portals & Capabilities

### 1. Customer Shopping Experience (`/`, `/products`, `/cart`, `/orders`)
- **Homepage (`/`)**: Hero banner, category grid with icons, spotlight products, and recommendation feeds.
- **Product Catalog (`/products`)**: Dynamic category filtering, in-stock toggles, price sorting, and responsive product cards.
- **Product Details (`/products/[productId]`)**: Photo gallery, configuration/variant picker, real-time stock indicator, buyer protection badges, and "Frequently Bought Together" recommendations.
- **Marketplace Search (`/search`)**: Real-time full-text query matching, max-price slider, and fast facet filtering.
- **Cart & Multi-Step Checkout (`/cart`, `/checkout`)**: Slide-in sheet and dedicated cart page with quantity controls, shipping address validation, tokenized payment selection, and coupon codes (`SAVE10`).
- **Orders & Live Tracking (`/orders`, `/orders/[orderId]`)**: Order history and live shipment tracking timeline (`Placed` → `Paid` → `Processing` → `Shipped` → `Delivered`).

### 2. Seller Marketplace Portal (`/seller/dashboard`)
- **Executive Metrics**: Gross merchandise sales, active listings counts, pending order count, and seller rating.
- **Listings & Inventory**: Active listings table with price and stock status, direct action button to list new marketplace products.
- **Fulfillment & Promotions**: Track merchant-fulfilled items, generate shipping manifests, create store coupons.

### 3. Admin Control Plane (`/admin/dashboard`)
- **Executive GMV Metrics**: Real-time order counts, customer registrations, and active seller counts.
- **Operational Governance**: Seller KYC verification approvals, chargeback dispute resolutions.
- **System Telemetry**: Distributed 16-microservices topology status grid, fast cache flush, and circuit breaker reset actions.
- **Immutable Audit Trail**: Chronological log of administrative actions with diff snapshots.

---

## 3. Actor-to-Service Communication Matrix

| Actor | Primary Services Interacted With |
|---|---|
| **Customer** | Auth, User, Catalog, Search, Cart, Pricing, Inventory, Order, Payment, Shipping, Review, Recommendation, Notification |
| **Seller** | Auth, User, **Seller Service**, Catalog, Inventory, Order, Pricing, Review, Notification |
| **Admin** | Auth, User, **Admin Service**, Seller, Catalog, Inventory, Order, Payment, Shipping, Pricing, Review, Notification |
| **Public / Guest** | Catalog, Search, Pricing, Recommendation |

---

## 4. Route Protection & Authorization

Frontend route protection is enforced via **Next.js Edge Middleware ([middleware.ts](file:///Users/chhay/Desktop/E-Commerce-Microservice/frontend/middleware.ts))**:
- `/products`, `/search`, `/auth/*` ➔ Public access
- `/cart`, `/checkout`, `/orders/*`, `/account` ➔ Requires authenticated `CUSTOMER`
- `/seller/*` ➔ Requires `SELLER` or `ADMIN` role
- `/admin/*` ➔ Requires `ADMIN` role

> **Defense in Depth**: Frontend middleware protects UI routing, but API Gateway (`:8000`) and backend microservices validate cryptographic JWT claims on every single API invocation.

---

## 5. The 4-Question UI Design Checklist

Before implementing any new page, modal, button, form, or action, engineers must follow the **Golden Architecture Sequence**:

```text
WHO (Actor) ──> WHAT (Business Action) ──> SERVICE (Domain Owner) ──> API (Gateway Route) ──> DATABASE / EVENT
```

1. **WHO is clicking it?** (Customer / Seller / Admin)
2. **WHAT business action are they performing?** (Describe actual business operation, not the UI label)
3. **WHICH microservice owns that business action?** (Assigned by domain data ownership, never API convenience)
4. **WHICH API represents that action?** (e.g., `POST /api/v1/orders`)

*Authoritative Guide*: See **[`docs/UI_API_INTEGRATION.md`](file:///Users/chhay/Desktop/E-Commerce-Microservice/docs/UI_API_INTEGRATION.md)** for the complete UI-to-API integration matrix and pre-coding feature specification templates.

---

## 6. Getting Started

### Local Development
```bash
cd frontend

# Install dependencies
npm install

# Start local Next.js dev server on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Standalone Run
```bash
npm run build
npm run start
```

### Docker Container Deployment
```bash
# Automated via platform deploy script:
cd ../deploy && ./deploy-all.sh
```
