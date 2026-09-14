# Core #13 — Recommendation Service

A high-performance recommendation and personalization microservice built with **Python 3.14**, **FastAPI**, **PostgreSQL**, **Redis**, **Kafka**, and **scikit-learn**.

## Architecture & Capabilities

```
+-----------------------------------------------------------------------------------------+
|                                Recommendation Service (Port 8093)                       |
|                                                                                         |
|  [REST API: FastAPI]                                                                    |
|    - GET /api/v1/recommendations/personalized                                           |
|    - GET /api/v1/recommendations/similar/{product_id}                                   |
|    - GET /api/v1/recommendations/bought-together/{product_id}                           |
|    - GET /api/v1/recommendations/trending                                               |
|    - GET /api/v1/recommendations/recently-viewed                                        |
|    - POST /api/v1/recommendations/interactions                                          |
|    - POST /api/v1/recommendations/feedback                                              |
|                                                                                         |
|  [Recommendation Engines]                                                               |
|    - ContentSimilarityEngine: TF-IDF vectorization & Cosine Similarity                      |
|    - CooccurrenceEngine: Item-to-item basket mining & Normalized association               |
|    - TrendingEngine: Interaction velocity with recency window decay                      |
|    - PersonalizationEngine: User profile expansion & hybrid score aggregation            |
|    - RankingService: Diversity filtering, price bounds, category, & in-stock checking   |
|                                                                                         |
|  [Storage & Ingestion]                                                                  |
|    - PostgreSQL (Port 5444): Candidates, relationships, interactions, feedback          |
|    - Redis (Port 6391): Multi-tier recommendation & trending cache                      |
|    - Kafka (Port 9092): Catalog, order, review, and interaction event consumer           |
+-----------------------------------------------------------------------------------------+
```

## Recommendation Strategies

1. **Personalized (`PERSONALIZED`)**
   - Expands user's recent interactions (`VIEW`=1, `SEARCH_CLICK`=2, `FAVORITE`=4, `ADD_TO_CART`=6, `PURCHASE`=10).
   - Cold-start fallback to trending/popular products for anonymous or new visitors.
   - Automatically excludes products already purchased/interacted with.

2. **Similar Products (`SIMILAR`)**
   - Sub-millisecond similarity scoring using TF-IDF tokenization over title, brand, category, tags, and description.
   - Fallback to database-persisted item relationships and category siblings.

3. **Frequently Bought Together (`BOUGHT_TOGETHER`)**
   - Market basket analysis calculating normalized pairwise co-occurrence across orders:
     $$\text{Score}(A, B) = \frac{\text{Count}(A \cap B)}{\sqrt{\text{Count}(A) \times \text{Count}(B)}}$$

4. **Trending Products (`TRENDING`)**
   - Measures interaction velocity over rolling time windows (default: 24h, configurable up to 168h).
   - Cold-start fallback to catalog popularity and rating metrics.

5. **Recently Viewed (`RECENTLY_VIEWED`)**
   - Tracks session-bound or authenticated user browsing history in reverse-chronological order.

## Tech Stack & Ports

| Component | Technology | Default Port / Connection |
| :--- | :--- | :--- |
| Framework | FastAPI + Uvicorn | `8093` |
| Database | PostgreSQL 16 | `5444` (`recommendation_db`) |
| Cache | Redis 7 | `6391` |
| Message Broker | Apache Kafka | `localhost:9092` |
| Machine Learning | scikit-learn, numpy, scipy | In-memory + persisted graph |
| Migrations | Alembic | `alembic upgrade head` |

## Getting Started

### Local Setup with uv

```bash
# 1. Create and activate virtual environment
uv venv --python 3.14
source .venv/bin/activate

# 2. Install dependencies
uv pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run tests
pytest
```

### Docker Compose

```bash
docker-compose up --build -d
```

### API Endpoints

- `GET /health`: Healthcheck endpoint reporting DB, Redis, and ML model status.
- `GET /docs`: Interactive Swagger UI documentation.
- `GET /api/v1/recommendations/personalized`: Personalized recommendations with query filtering.
- `GET /api/v1/recommendations/similar/{product_id}`: Similar items for a product detail page.
- `GET /api/v1/recommendations/bought-together/{product_id}`: Frequently bought together basket add-ons.
- `GET /api/v1/recommendations/trending`: Real-time trending products.
- `GET /api/v1/recommendations/recently-viewed`: Products recently viewed by user or session.
- `POST /api/v1/recommendations/interactions`: Ingest user behavior events.
- `POST /api/v1/recommendations/feedback`: Log recommendation impression / click / conversion feedback.
- `POST /api/v1/recommendations/admin/train`: Trigger offline/batch retraining of ML models.
- `GET /api/v1/recommendations/admin/status`: Model status and cache availability.
