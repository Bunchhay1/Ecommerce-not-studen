# Catalog Service (Core Service #03)

The **Catalog Service** manages the product catalog for the E-Commerce Microservices platform.

## Responsibilities

✓ Products & Product Variants  
✓ Categories & Hierarchical Category Tree  
✓ Brands  
✓ Product Attributes & Specifications  
✓ Product Images  
✓ Product Status (`DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`)  
✓ Redis Caching for fast read access  
✓ Kafka Event Publishing (`ProductCreated`, `ProductUpdated`, `ProductDeleted`, `ProductStatusChanged`, `CategoryCreated`, `BrandCreated`)  
✓ SpringDoc OpenAPI / Swagger documentation  

It does **not** manage:
✗ User authentication (handled by Auth Service)  
✗ User profiles (handled by User Service)  
✗ Shopping cart  
✗ Stock quantity / Inventory  
✗ Orders & Payments  
✗ Shipping  

---

## Technology Stack

- **Language:** Java 21+
- **Framework:** Spring Boot 3.3.4
- **Persistence:** Spring Data JPA / Hibernate
- **Database:** PostgreSQL 16
- **Database Migrations:** Flyway
- **Cache:** Redis / Spring Data Redis
- **Message Broker:** Apache Kafka / Spring Kafka
- **Security:** Spring Security 6 with JWT validation
- **Documentation:** SpringDoc OpenAPI 2.6.0 (Swagger UI)
- **Testing:** JUnit 5 + Mockito + Spring Security Test + H2
- **Containerization:** Docker & Docker Compose

---

## Architecture & Design

```
                  ┌──────────────────────┐
                  │     API Gateway      │
                  └──────────┬───────────┘
                             │ REST + JWT
                             ▼
               ┌───────────────────────────────┐
               │        Catalog Service        │
               │  (Spring Boot 3.x / Java 21)  │
               └───────┬──────────────┬────────┘
                       │              │
        ┌──────────────┴──────┐       └──────────────┬──────────────┐
        ▼                     ▼                      ▼              ▼
 ┌──────────────┐      ┌─────────────┐        ┌─────────────┐ ┌───────────┐
 │  PostgreSQL  │      │ Redis Cache │        │ Kafka Topic │ │  Flyway   │
 │   (Schema)   │      │  (Catalog)  │        │  (Events)   │ │Migrations │
 └──────────────┘      └─────────────┘        └─────────────┘ └───────────┘
```

---

## API Endpoints

### Health Check
- `GET /api/v1/health` - Health and uptime status (Public)

### Categories
- `GET /api/v1/categories` - List categories (optional `rootsOnly=true` parameter) (Public)
- `GET /api/v1/categories/{id}` - Category details by ID (Public)
- `GET /api/v1/categories/slug/{slug}` - Category details by Slug (Public)
- `POST /api/v1/categories` - Create category (`ROLE_ADMIN`, `ROLE_SELLER`)
- `PUT /api/v1/categories/{id}` - Update category (`ROLE_ADMIN`, `ROLE_SELLER`)
- `DELETE /api/v1/categories/{id}` - Delete category (`ROLE_ADMIN`, `ROLE_SELLER`)

### Brands
- `GET /api/v1/brands` - List all brands (Public)
- `GET /api/v1/brands/{id}` - Brand details by ID (Public)
- `GET /api/v1/brands/slug/{slug}` - Brand details by Slug (Public)
- `POST /api/v1/brands` - Create brand (`ROLE_ADMIN`, `ROLE_SELLER`)
- `PUT /api/v1/brands/{id}` - Update brand (`ROLE_ADMIN`, `ROLE_SELLER`)
- `DELETE /api/v1/brands/{id}` - Delete brand (`ROLE_ADMIN`, `ROLE_SELLER`)

### Products
- `GET /api/v1/products` - Browse products with pagination, sort, and filters (`status`, `categoryId`, `brandId`) (Public)
- `GET /api/v1/products/{id}` - Product details with brand, category, attributes, and images (Public)
- `GET /api/v1/products/slug/{slug}` - Product details by slug (Public)
- `POST /api/v1/products` - Create product with attributes, images, and variants (`ROLE_ADMIN`, `ROLE_SELLER`)
- `PUT /api/v1/products/{id}` - Update product (`ROLE_ADMIN`, `ROLE_SELLER`)
- `PATCH /api/v1/products/{id}/status` - Update status (`DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`) (`ROLE_ADMIN`, `ROLE_SELLER`)
- `DELETE /api/v1/products/{id}` - Delete product (`ROLE_ADMIN`, `ROLE_SELLER`)

### Product Variants
- `GET /api/v1/products/{productId}/variants` - List variants for product (Public)
- `POST /api/v1/products/{productId}/variants` - Add variant (`ROLE_ADMIN`, `ROLE_SELLER`)
- `PUT /api/v1/variants/{variantId}` - Update variant (`ROLE_ADMIN`, `ROLE_SELLER`)
- `DELETE /api/v1/variants/{variantId}` - Delete variant (`ROLE_ADMIN`, `ROLE_SELLER`)

---

## Running Locally

### 1. Start Infrastructure via Docker Compose
```bash
docker compose up -d
```
This starts PostgreSQL (port `5434`), Redis (port `6381`), and Kafka (port `9094`).

### 2. Build and Run the Service
```bash
mvn clean spring-boot:run
```

### 3. Run Automated Unit Tests
```bash
mvn clean test
```

### 4. Swagger / OpenAPI Documentation
Open in browser: `http://localhost:8083/swagger-ui.html`
