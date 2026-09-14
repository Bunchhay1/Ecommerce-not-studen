# Search Service (Core Service #04)

The **Search Service** is responsible for high-performance product discovery, full-text search, multi-attribute filtering, faceted navigation, autocomplete, and search suggestions across the E-Commerce platform.

> **Important Architecture Rule:**  
> The **Catalog Service** is the sole source of truth for product data.  
> The **Search Service** maintains a read-optimized projection of the product catalog in **OpenSearch**, synchronized via **Apache Kafka** event streams.

---

## 1. Responsibilities

✓ Full-text keyword search with fuzzy matching (`multi_match`, relevance boosting)  
✓ Multi-facet filtering (`category_id`, `brand_id`, `min_price`, `max_price`, `status`)  
✓ Sorting (`relevance`, `price_asc`, `price_desc`, `newest`)  
✓ Sub-millisecond autocomplete and search suggestions (`completion` suggester & `edge_ngram`)  
✓ Redis caching for queries and autocomplete suggestions  
✓ Continuous index synchronization via Kafka consumer (`ProductCreated`, `ProductUpdated`, `ProductDeleted`, `ProductStatusChanged`)  
✓ Zero-downtime blue/green index reindexing (`POST /api/v1/admin/reindex`)  
✓ Health checks (`/health`, `/health/live`, `/health/ready`)  

It does **not** manage:
✗ Product creation or direct editing  
✗ Stock quantity / Inventory  
✗ Shopping cart & Orders  
✗ User authentication or profiles  

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| **Language** | Python 3.12+ |
| **Framework** | FastAPI + Uvicorn |
| **Search Engine** | OpenSearch 2.15+ (async client) |
| **Event Broker** | Apache Kafka (`aiokafka`) |
| **Cache** | Redis 7 (`redis-py` async) |
| **Database** | PostgreSQL 16 (`search_db` for metadata & synonyms) |
| **ORM / Migration** | SQLAlchemy 2.0 (Async) + Alembic |
| **Validation** | Pydantic v2 & Pydantic Settings |
| **Testing** | pytest, pytest-asyncio, pytest-mock |
| **Containerization** | Docker & Docker Compose |

---

## 3. Architecture & Data Flow

```
                    ┌─────────────────────────┐
                    │       API Gateway       │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
      Catalog Service                         Search Service
    (Java / Spring Boot)                     (Python / FastAPI)
             │                                       │
             ▼ (Publishes Events)                    ▼
       ┌───────────┐                          ┌──────────────┐
       │   Kafka   │ ═══════════════════════> │ Kafka Worker │
       └───────────┘    (ProductCreated,      └──────┬───────┘
                         ProductUpdated,             │ (Upsert/Delete)
                         ProductDeleted)             ▼
                                              ┌──────────────┐
                                              │  OpenSearch  │
                                              │ (products_v1)│
                                              └──────┬───────┘
                                                     │
                                              ┌──────┴───────┐
                                              ▼              ▼
                                        ┌───────────┐  ┌───────────┐
                                        │Redis Cache│  │PostgreSQL │
                                        │(Queries & │  │(Synonyms &│
                                        │ Autocomp) │  │  Configs) │
                                        └───────────┘  └───────────┘
```

---

## 4. API Specification

### Health Endpoints
- `GET /health` - Overall service status (Public)
- `GET /health/live` - Liveness probe (Public)
- `GET /health/ready` - Readiness probe checking OpenSearch & Redis (Public)

### Search & Autocomplete Endpoints
- `GET /api/v1/search` - Search products with query, filters, facets, and pagination (Public)
  - Query parameters:
    - `q` (string): Keyword / term
    - `category_id` (string): Filter by Category ID
    - `brand_id` (string): Filter by Brand ID
    - `min_price` (float): Minimum price
    - `max_price` (float): Maximum price
    - `status` (string, default: `ACTIVE`): Filter status
    - `sort` (`relevance` | `price_asc` | `price_desc` | `newest`)
    - `page` (int, default: 1)
    - `size` (int, default: 20)
- `GET /api/v1/search/autocomplete` - Fast prefix suggestions (Public)
  - Query parameters: `q`, `size`
- `GET /api/v1/search/suggestions` - Comprehensive suggestions (Public)

### Admin Endpoints (Protected: `ROLE_ADMIN`)
- `POST /api/v1/admin/reindex` - Trigger zero-downtime blue/green reindex from Catalog Service
- `GET /api/v1/admin/indices` - Get index status and alias mapping

---

## 5. Running Locally

### 1. Start Infrastructure via Docker Compose
```bash
docker compose up -d
```
This spins up OpenSearch (port `9200`), OpenSearch Dashboards (port `5601`), Redis (port `6382`), and PostgreSQL (port `5435`).

### 2. Run Locally with Virtualenv
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8084 --reload
```

### 3. Run Automated Tests
```bash
pytest -v
```

### 4. Interactive API Documentation
- Swagger UI: `http://localhost:8084/docs`
- ReDoc: `http://localhost:8084/redoc`
